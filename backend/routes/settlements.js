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
    query('group').optional().isMongoId().withMessage('Invalid group ID'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('user').optional().isMongoId().withMessage('Invalid user ID'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const groupId = req.query.groupId || req.query.group;
      const userId = req.query.userId || req.query.user;
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
        // 1-on-1 settlements between current user and specified user
        filter = {
          group: null,
          $or: [
            { from: currentUserId, to: userId },
            { from: userId, to: currentUserId },
          ],
        };
      } else {
        // All settlements involving the current user
        filter = {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        };
      }

      const settlements = await Settlement.find(filter)
        .populate('from', 'name email avatar defaultCurrency')
        .populate('to', 'name email avatar defaultCurrency')
        .populate('group', 'name currency type')
        .populate('createdBy', 'name email')
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
// @desc    Record a new settlement payment
// @access  Protected
router.post(
  '/',
  [
    body('to')
      .notEmpty()
      .withMessage('Recipient user ID (to) is required')
      .isMongoId()
      .withMessage('Invalid recipient user ID'),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('currency')
      .optional()
      .isIn(SUPPORTED_CURRENCIES)
      .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
    body('group')
      .optional({ nullable: true, checkFalsy: true })
      .isMongoId()
      .withMessage('Invalid group ID'),
    body('date')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Date must be a valid ISO 8601 date'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { to, amount, currency, group, date, notes } = req.body;
      const currentUserId = req.user._id.toString();

      if (to === currentUserId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot record a settlement payment to yourself',
        });
      }

      const recipient = await User.findById(to);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient user not found',
        });
      }

      if (group) {
        const groupDoc = await Group.findById(group);
        if (!groupDoc) {
          return res.status(404).json({
            success: false,
            message: 'Group not found',
          });
        }

        const currentIsMember = groupDoc.members.some(
          (m) => getUserIdString(m.user) === currentUserId
        );
        const recipientIsMember = groupDoc.members.some(
          (m) => getUserIdString(m.user) === to
        );

        if (!currentIsMember || !recipientIsMember) {
          return res.status(400).json({
            success: false,
            message: 'Both sender and recipient must be members of the group',
          });
        }
      }

      const settlement = await Settlement.create({
        from: req.user._id,
        to,
        amount: Number(amount),
        currency: currency ? currency.toUpperCase() : req.user.defaultCurrency || 'INR',
        group: group || null,
        date: date || new Date(),
        notes: notes ? notes.trim() : '',
        createdBy: req.user._id,
      });

      const populatedSettlement = await Settlement.findById(settlement._id)
        .populate('from', 'name email avatar defaultCurrency')
        .populate('to', 'name email avatar defaultCurrency')
        .populate('group', 'name currency type')
        .populate('createdBy', 'name email');

      return res.status(201).json({
        success: true,
        message: 'Settlement recorded successfully',
        settlement: populatedSettlement,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/settlements/:id
// @desc    Delete a settlement (only the creator/payer can delete)
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

      const currentUserId = req.user._id.toString();
      const creatorId = settlement.createdBy
        ? settlement.createdBy.toString()
        : settlement.from.toString();

      if (creatorId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only the creator of this settlement can delete it',
        });
      }

      await settlement.deleteOne();

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
