import express from 'express';
import { body, param } from 'express-validator';
import Group, { generateInviteCode } from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { calculateBalances, getUserIdString } from '../utils/balanceCalculator.js';

const router = express.Router();

// All group routes are protected
router.use(protect);

// @route   GET /api/groups
// @desc    Get all groups where current user is a member
// @access  Protected
router.get('/', async (req, res, next) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email avatar defaultCurrency')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Protected
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Group name is required')
      .isLength({ max: 100 })
      .withMessage('Group name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('type')
      .optional()
      .isIn(['trip', 'home', 'couple', 'other'])
      .withMessage('Invalid group type. Must be trip, home, couple, or other'),
    body('currency')
      .optional()
      .isIn(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'])
      .withMessage('Invalid currency'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, description, type, currency } = req.body;

      // Generate a unique 6-character alphanumeric invite code
      let inviteCode = generateInviteCode();
      let existingGroup = await Group.findOne({ inviteCode });
      while (existingGroup) {
        inviteCode = generateInviteCode();
        existingGroup = await Group.findOne({ inviteCode });
      }

      const group = await Group.create({
        name,
        description: description || '',
        type: type || 'other',
        currency: currency ? currency.toUpperCase() : req.user.defaultCurrency || 'INR',
        inviteCode,
        createdBy: req.user._id,
        members: [
          {
            user: req.user._id,
            role: 'admin',
            joinedAt: new Date(),
          },
        ],
      });

      await group.populate('members.user', 'name email avatar defaultCurrency');
      await group.populate('createdBy', 'name email avatar');

      return res.status(201).json({
        success: true,
        message: 'Group created successfully',
        group,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/groups/join
// @desc    Join a group via inviteCode
// @access  Protected
router.post(
  '/join',
  [
    body('inviteCode')
      .trim()
      .notEmpty()
      .withMessage('Invite code is required'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const inviteCode = req.body.inviteCode.toUpperCase().trim();
      const group = await Group.findOne({ inviteCode });

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'No group found with that invite code',
        });
      }

      // Check if user is already a member
      const isAlreadyMember = group.members.some(
        (m) => getUserIdString(m.user) === req.user._id.toString()
      );

      if (isAlreadyMember) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this group',
          group,
        });
      }

      group.members.push({
        user: req.user._id,
        role: 'member',
        joinedAt: new Date(),
      });

      await group.save();
      await group.populate('members.user', 'name email avatar defaultCurrency');
      await group.populate('createdBy', 'name email avatar');

      return res.status(200).json({
        success: true,
        message: 'Joined group successfully',
        group,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/groups/:id
// @route   POST /api/groups/:id/members
// @desc    Add a member to a group by email or userId
// @access  Protected (Members only)
router.post(
  '/:id/members',
  [param('id').isMongoId().withMessage('Invalid group ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }

      const isCurrentMember = group.members.some(
        (m) => getUserIdString(m.user) === req.user._id.toString()
      );
      if (!isCurrentMember) {
        return res.status(403).json({ success: false, message: 'You must be a member to add people to this group' });
      }

      const { email, userId } = req.body;
      let targetUser = null;
      if (userId) {
        targetUser = await User.findById(userId);
      } else if (email) {
        const cleanEmail = email.trim().toLowerCase();
        targetUser = await User.findOne({ email: cleanEmail });
        if (!targetUser) {
          const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
          const namePart = cleanEmail.split('@')[0];
          targetUser = await User.create({
            name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
            email: cleanEmail,
            password: tempPassword,
            defaultCurrency: group.currency || 'INR',
          });
        }
      }

      if (!targetUser) {
        return res.status(400).json({ success: false, message: 'Please provide a valid user email or ID' });
      }

      const alreadyMember = group.members.some(
        (m) => getUserIdString(m.user) === targetUser._id.toString()
      );
      if (alreadyMember) {
        return res.status(400).json({ success: false, message: `${targetUser.name} is already a member of this group` });
      }

      group.members.push({
        user: targetUser._id,
        role: 'member',
        joinedAt: new Date(),
      });

      await group.save();
      await group.populate('members.user', 'name email avatar defaultCurrency');
      await group.populate('createdBy', 'name email avatar');

      return res.status(200).json({
        success: true,
        message: `${targetUser.name} added to the group successfully`,
        group,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/groups/:id
// @desc    Get group details with populated members
// @access  Protected (Members only)
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid group ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const group = await Group.findById(req.params.id)
        .populate('members.user', 'name email avatar defaultCurrency')
        .populate('createdBy', 'name email avatar');

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      const isMember = group.members.some(
        (m) => getUserIdString(m.user) === req.user._id.toString()
      );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group',
        });
      }

      return res.status(200).json({
        success: true,
        group,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/groups/:id
// @desc    Update group name, description, type, currency
// @access  Protected (Admin only)
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid group ID'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Group name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Group name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('type')
      .optional()
      .isIn(['trip', 'home', 'couple', 'other'])
      .withMessage('Invalid group type. Must be trip, home, couple, or other'),
    body('currency')
      .optional()
      .isIn(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'])
      .withMessage('Invalid currency'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const group = await Group.findById(req.params.id);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      const isAdmin = group.members.some(
        (m) => getUserIdString(m.user) === req.user._id.toString() && m.role === 'admin'
      );

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only group admins can update group details',
        });
      }

      const { name, description, type, currency, isSettled } = req.body;

      if (name) group.name = name;
      if (description !== undefined) group.description = description;
      if (type) group.type = type;
      if (currency) group.currency = currency.toUpperCase();
      if (typeof isSettled === 'boolean') group.isSettled = isSettled;

      await group.save();
      await group.populate('members.user', 'name email avatar defaultCurrency');
      await group.populate('createdBy', 'name email avatar');

      return res.status(200).json({
        success: true,
        message: 'Group updated successfully',
        group,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/groups/:id
// @desc    Delete group and all associated expenses and settlements
// @access  Protected (Admin only)
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid group ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const group = await Group.findById(req.params.id);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      const isAdmin = group.members.some(
        (m) => getUserIdString(m.user) === req.user._id.toString() && m.role === 'admin'
      );

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only group admins can delete the group',
        });
      }

      // Delete associated expenses and settlements
      await Expense.deleteMany({ group: group._id });
      await Settlement.deleteMany({ group: group._id });
      await Group.findByIdAndDelete(group._id);

      return res.status(200).json({
        success: true,
        message: 'Group and all associated expenses and settlements deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Protected (Members only)
router.post(
  '/:id/leave',
  [
    param('id').isMongoId().withMessage('Invalid group ID'),
    body('transferAdminTo')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID for admin transfer'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const group = await Group.findById(req.params.id);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      const memberIndex = group.members.findIndex(
        (m) => getUserIdString(m.user) === req.user._id.toString()
      );

      if (memberIndex === -1) {
        return res.status(400).json({
          success: false,
          message: 'You are not a member of this group',
        });
      }

      const currentMember = group.members[memberIndex];

      // If this is the only member in the group, they should delete the group instead
      if (group.members.length === 1) {
        return res.status(400).json({
          success: false,
          message: 'You are the only member in this group. Please delete the group instead of leaving.',
        });
      }

      // If current member is admin, check if there are other admins
      if (currentMember.role === 'admin') {
        const otherAdmins = group.members.filter(
          (m, idx) => idx !== memberIndex && m.role === 'admin'
        );

        if (otherAdmins.length === 0) {
          // Last admin is leaving - transfer admin
          const { transferAdminTo } = req.body;
          if (transferAdminTo) {
            const targetMember = group.members.find(
              (m, idx) =>
                idx !== memberIndex && getUserIdString(m.user) === transferAdminTo.toString()
            );

            if (!targetMember) {
              return res.status(400).json({
                success: false,
                message: 'Specified member for admin transfer is not in this group',
              });
            }
            targetMember.role = 'admin';
          } else {
            // Auto-promote the first remaining member to admin
            const remainingMembers = group.members.filter((_, idx) => idx !== memberIndex);
            remainingMembers[0].role = 'admin';
          }
        }
      }

      // Remove current user from members
      group.members.splice(memberIndex, 1);
      await group.save();

      return res.status(200).json({
        success: true,
        message: 'Successfully left the group',
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/groups/:id/balances
// @desc    Calculate and return balances for this group
// @access  Protected (Members only)
router.get(
  '/:id/balances',
  [param('id').isMongoId().withMessage('Invalid group ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const group = await Group.findById(req.params.id)
        .populate('members.user', 'name email avatar defaultCurrency');

      if (!group) {
        return res.status(404).json({
          success: false,
          message: 'Group not found',
        });
      }

      const isMember = group.members.some(
        (m) => getUserIdString(m.user) === req.user._id.toString()
      );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this group',
        });
      }

      // Fetch all expenses and settlements for this group
      const [expenses, settlements] = await Promise.all([
        Expense.find({ group: group._id })
          .populate('paidBy', 'name email avatar')
          .populate('splits.user', 'name email avatar'),
        Settlement.find({ group: group._id })
          .populate('from', 'name email avatar')
          .populate('to', 'name email avatar'),
      ]);

      const balancesData = calculateBalances(expenses, settlements, group.members);

      // Create member user lookup map for simplifiedDebts display
      const memberMap = {};
      for (const m of group.members) {
        if (m.user) {
          const uId = getUserIdString(m.user);
          memberMap[uId] = {
            _id: uId,
            name: m.user.name || 'User',
            email: m.user.email || '',
            avatar: m.user.avatar || '',
          };
        }
      }

      // Enhance simplified debts with user profiles
      const enrichedSimplifiedDebts = balancesData.simplifiedDebts.map((debt) => ({
        ...debt,
        fromUser: memberMap[debt.from] || { _id: debt.from, name: 'User' },
        toUser: memberMap[debt.to] || { _id: debt.to, name: 'User' },
      }));

      return res.status(200).json({
        success: true,
        groupId: group._id,
        groupName: group.name,
        currency: group.currency,
        netBalances: balancesData.netBalances,
        simplifiedDebts: enrichedSimplifiedDebts,
        userBreakdown: balancesData.userBreakdown,
        summary: balancesData.summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
