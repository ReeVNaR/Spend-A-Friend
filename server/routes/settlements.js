import express from 'express';
import { body, param, query } from 'express-validator';
import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { getUserIdString } from '../utils/balanceCalculator.js';
import { SUPPORTED_CURRENCIES } from '../utils/currencyRates.js';

const router = express.Router();

// All settlement routes are protected
router.use(protect);

// @route   GET /api/settlements
// @desc    Get settlements, optionally filtered by groupId or userId
// @access  Protected
router.get(
  '/',
  [
    query('groupId').optional().isMongoId().withMessage('Invalid group ID'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { groupId, userId } = req.query;
      const currentUserId = req.user._id.toString();

      let filter = {};

      if (groupId && userId) {
        filter = {
          group: groupId,
          $or: [
            { from: currentUserId, to: userId },
            { from: userId, to: currentUserId },
          ],
        };
      } else if (groupId) {
        // Verify group exists & user is member
        const group = await Group.findById(groupId);
        if (!group) {
          return res.status(404).json({
            success: false,
            message: 'Group not found',
          });
        }

        const isMember = group.members.some(
          (m) => getUserIdString(m.user) === currentUserId
        );

        if (!isMember) {
          return res.status(403).json({
            success: false,
            message: 'You are not a member of this group',
          });
        }

        filter = { group: groupId };
      } else if (userId) {
        // Settlements between current user and specified user
        filter = {
          $or: [
            { from: currentUserId, to: userId },
            { from: userId, to: currentUserId },
          ],
        };
      } else {
        // All settlements involving current user
        filter = {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        };
      }

      const settlements = await Settlement.find(filter)
        .populate('from', 'name email avatar defaultCurrency')
        .populate('to', 'name email avatar defaultCurrency')
        .populate('group', 'name currency')
        .sort({ date: -1, createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: settlements.length,
        settlements,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/settlements
// @desc    Record a settlement payment between users
// @access  Protected
router.post(
  '/',
  [
    body('to')
      .notEmpty()
      .withMessage('Recipient (to) is required')
      .isMongoId()
      .withMessage('Invalid recipient user ID'),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Settlement amount must be greater than zero'),
    body('from')
      .optional()
      .isMongoId()
      .withMessage('Invalid payer user ID'),
    body('currency')
      .optional()
      .toUpperCase()
      .isIn(SUPPORTED_CURRENCIES)
      .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
    body('group')
      .optional({ nullable: true, checkFalsy: true })
      .isMongoId()
      .withMessage('Invalid group ID'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { to, amount, from: reqFrom, currency, group: groupId, notes, date } = req.body;
      const fromUserId = reqFrom || req.user._id.toString();

      // Cannot settle with oneself
      if (fromUserId.toString() === to.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot record a settlement to yourself',
        });
      }

      // Verify current user is either payer or recipient
      const currentUserId = req.user._id.toString();
      if (fromUserId.toString() !== currentUserId && to.toString() !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'You can only record settlements that you paid or received',
        });
      }

      // Check recipient user exists
      const recipientUser = await User.findById(to);
      if (!recipientUser) {
        return res.status(404).json({
          success: false,
          message: 'Recipient user not found',
        });
      }

      // Check payer user exists
      const payerUser = await User.findById(fromUserId);
      if (!payerUser) {
        return res.status(404).json({
          success: false,
          message: 'Payer user not found',
        });
      }

      // If group is provided, verify group and memberships
      if (groupId) {
        const group = await Group.findById(groupId);
        if (!group) {
          return res.status(404).json({
            success: false,
            message: 'Group not found',
          });
        }

        const isFromMember = group.members.some(
          (m) => getUserIdString(m.user) === fromUserId.toString()
        );
        const isToMember = group.members.some(
          (m) => getUserIdString(m.user) === to.toString()
        );

        if (!isFromMember || !isToMember) {
          return res.status(400).json({
            success: false,
            message: 'Both payer and recipient must be members of the group',
          });
        }
      }

      const settlement = await Settlement.create({
        from: fromUserId,
        to,
        amount: Math.round(Number(amount) * 100) / 100,
        currency: currency ? currency.toUpperCase() : req.user.defaultCurrency || 'INR',
        group: groupId || null,
        notes: notes || '',
        date: date ? new Date(date) : new Date(),
      });

      await settlement.populate('from', 'name email avatar defaultCurrency');
      await settlement.populate('to', 'name email avatar defaultCurrency');
      await settlement.populate('group', 'name currency');

      return res.status(201).json({
        success: true,
        message: 'Settlement recorded successfully',
        settlement,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/settlements/:id
// @desc    Delete a settlement (Only creator / from user)
// @access  Protected
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid settlement ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const settlement = await Settlement.findById(req.params.id);

      if (!settlement) {
        return res.status(404).json({
          success: false,
          message: 'Settlement not found',
        });
      }

      // Only the payer ('from' user) can delete
      if (getUserIdString(settlement.from) !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the payer who recorded this settlement can delete it',
        });
      }

      await Settlement.findByIdAndDelete(settlement._id);

      return res.status(200).json({
        success: true,
        message: 'Settlement deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
