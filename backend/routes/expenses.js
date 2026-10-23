import express from 'express';
import { body, param, query } from 'express-validator';
import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { getUserIdString } from '../utils/balanceCalculator.js';
import { convertCurrency, SUPPORTED_CURRENCIES } from '../utils/currencyRates.js';

const router = express.Router();

// All expense routes are protected
router.use(protect);

/**
 * Helper to validate and calculate split amounts based on splitType
 */
const processSplits = (totalAmount, splitType = 'equal', rawSplits = []) => {
  if (!Array.isArray(rawSplits) || rawSplits.length === 0) {
    throw new Error('At least one split participant is required');
  }

  const numAmount = Number(totalAmount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  // Extract and validate unique user IDs
  const normalized = rawSplits.map((item) => {
    const rawUser = item.user !== undefined ? item.user : item;
    const userId = getUserIdString(rawUser);
    if (!userId) {
      throw new Error('Invalid user ID provided in splits');
    }
    return {
      user: userId,
      amount: item.amount !== undefined ? Number(item.amount) : 0,
      percentage: item.percentage !== undefined ? Number(item.percentage) : 0,
      isPaid: Boolean(item.isPaid),
    };
  });

  const uniqueUsers = new Set(normalized.map((s) => s.user));
  if (uniqueUsers.size !== normalized.length) {
    throw new Error('Duplicate users found in splits');
  }

  const count = normalized.length;

  if (splitType === 'equal') {
    // Distribute equally with penny rounding correction
    const baseShare = Math.floor((numAmount / count) * 100) / 100;
    let remainder = Math.round((numAmount - baseShare * count) * 100) / 100;

    return normalized.map((item) => {
      let share = baseShare;
      if (remainder > 0.009) {
        share = Math.round((share + 0.01) * 100) / 100;
        remainder = Math.round((remainder - 0.01) * 100) / 100;
      }
      return {
        user: item.user,
        amount: share,
        isPaid: item.isPaid,
      };
    });
  }

  if (splitType === 'exact') {
    let sum = 0;
    const result = normalized.map((item) => {
      if (isNaN(item.amount) || item.amount < 0) {
        throw new Error('Each exact split amount must be a non-negative number');
      }
      const rounded = Math.round(item.amount * 100) / 100;
      sum += rounded;
      return {
        user: item.user,
        amount: rounded,
        isPaid: item.isPaid,
      };
    });

    const diff = Math.abs(Math.round(sum * 100) / 100 - Math.round(numAmount * 100) / 100);
    if (diff > 0.05) {
      throw new Error(
        `Split amounts total (${sum.toFixed(2)}) must equal the expense amount (${numAmount.toFixed(2)})`
      );
    }

    return result;
  }

  if (splitType === 'percentage') {
    let totalPct = 0;
    for (const item of normalized) {
      if (isNaN(item.percentage) || item.percentage < 0) {
        throw new Error('Each split percentage must be a non-negative number');
      }
      totalPct += item.percentage;
    }

    if (Math.abs(totalPct - 100) > 0.1) {
      throw new Error(`Split percentages must sum to 100% (got ${totalPct.toFixed(2)}%)`);
    }

    let calculatedSum = 0;
    const result = normalized.map((item) => {
      const share = Math.round(((numAmount * item.percentage) / 100) * 100) / 100;
      calculatedSum += share;
      return {
        user: item.user,
        amount: share,
        isPaid: item.isPaid,
      };
    });

    // Adjust any single-cent rounding difference on the first participant
    const diff = Math.round((numAmount - calculatedSum) * 100) / 100;
    if (result.length > 0 && Math.abs(diff) > 0) {
      result[0].amount = Math.round((result[0].amount + diff) * 100) / 100;
    }

    return result;
  }

  throw new Error('Invalid split type. Supported: equal, exact, percentage');
};

// @route   GET /api/expenses
// @desc    Get expenses with filtering by groupId or friendId, plus pagination
// @access  Protected
router.get(
  '/',
  [
    query('groupId').optional().isMongoId().withMessage('Invalid group ID'),
    query('group').optional().isMongoId().withMessage('Invalid group ID'),
    query('friendId').optional().isMongoId().withMessage('Invalid friend ID'),
    query('friend').optional().isMongoId().withMessage('Invalid friend ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const groupId = req.query.groupId || req.query.group;
      const friendId = req.query.friendId || req.query.friend;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      let filter = {};

      if (groupId) {
        // Filter by group: verify user is a member of the group
        const group = await Group.findById(groupId);
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

        filter = { group: groupId };
      } else if (friendId) {
        // 1-on-1 expenses between current user and friend (no group)
        filter = {
          group: null,
          $or: [
            { paidBy: req.user._id, 'splits.user': friendId },
            { paidBy: friendId, 'splits.user': req.user._id },
          ],
        };
      } else {
        // All expenses involving the current user (paidBy or in splits)
        filter = {
          $or: [
            { paidBy: req.user._id },
            { 'splits.user': req.user._id },
          ],
        };
      }

      const total = await Expense.countDocuments(filter);
      const expenses = await Expense.find(filter)
        .populate('paidBy', 'name email avatar defaultCurrency')
        .populate('splits.user', 'name email avatar defaultCurrency')
        .populate('group', 'name currency type')
        .populate('createdBy', 'name email')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        success: true,
        count: expenses.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        expenses,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Protected
router.post(
  '/',
  [
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Expense description is required')
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters'),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than zero'),
    body('currency')
      .optional()
      .toUpperCase()
      .isIn(SUPPORTED_CURRENCIES)
      .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
    body('category')
      .optional()
      .isIn([
        'food',
        'transport',
        'accommodation',
        'shopping',
        'entertainment',
        'utilities',
        'medical',
        'other',
      ])
      .withMessage('Invalid expense category'),
    body('paidBy')
      .optional()
      .isMongoId()
      .withMessage('Invalid payer user ID'),
    body('group')
      .optional({ nullable: true, checkFalsy: true })
      .isMongoId()
      .withMessage('Invalid group ID'),
    body('splitType')
      .optional()
      .isIn(['equal', 'exact', 'percentage'])
      .withMessage('Invalid split type. Must be equal, exact, or percentage'),
    body('splits')
      .isArray({ min: 1 })
      .withMessage('Splits must be an array with at least one participant'),
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
      const {
        description,
        amount,
        currency: reqCurrency,
        category,
        paidBy: reqPaidBy,
        group: groupId,
        splitType = 'equal',
        splits: rawSplits,
        notes,
        date,
      } = req.body;

      const numAmount = Math.round(Number(amount) * 100) / 100;
      const payerId = reqPaidBy || req.user._id.toString();

      // Check payer existence
      const payerUser = await User.findById(payerId);
      if (!payerUser) {
        return res.status(404).json({
          success: false,
          message: 'Payer user not found',
        });
      }

      // Calculate splits
      let calculatedSplits;
      try {
        calculatedSplits = processSplits(numAmount, splitType, rawSplits);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      let groupDoc = null;
      let expenseCurrency = reqCurrency ? reqCurrency.toUpperCase() : req.user.defaultCurrency || 'INR';

      // If group is specified, validate group membership
      if (groupId) {
        groupDoc = await Group.findById(groupId);
        if (!groupDoc) {
          return res.status(404).json({
            success: false,
            message: 'Group not found',
          });
        }

        // Verify current user is in the group
        const isCurrentUserMember = groupDoc.members.some(
          (m) => getUserIdString(m.user) === req.user._id.toString()
        );
        if (!isCurrentUserMember) {
          return res.status(403).json({
            success: false,
            message: 'You are not a member of this group',
          });
        }

        // Verify payer is in the group
        const isPayerMember = groupDoc.members.some(
          (m) => getUserIdString(m.user) === payerId.toString()
        );
        if (!isPayerMember) {
          return res.status(400).json({
            success: false,
            message: 'The payer must be a member of the group',
          });
        }

        // Verify all split users are in the group
        for (const split of calculatedSplits) {
          const isSplitMember = groupDoc.members.some(
            (m) => getUserIdString(m.user) === split.user.toString()
          );
          if (!isSplitMember) {
            return res.status(400).json({
              success: false,
              message: `Participant ${split.user} is not a member of the group`,
            });
          }
        }

        // Default currency to group's currency if not provided
        if (!reqCurrency) {
          expenseCurrency = groupDoc.currency || 'INR';
        }
      } else {
        // 1-on-1 / non-group expense: verify all split participants exist
        const splitUserIds = calculatedSplits.map((s) => s.user);
        const usersCount = await User.countDocuments({ _id: { $in: splitUserIds } });
        if (usersCount !== splitUserIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more split participant users do not exist',
          });
        }

        // Current user must be either the payer or one of the split participants
        const userInSplits = splitUserIds.includes(req.user._id.toString());
        const userIsPayer = payerId.toString() === req.user._id.toString();
        if (!userInSplits && !userIsPayer) {
          return res.status(403).json({
            success: false,
            message: 'You must be either the payer or a participant in this expense',
          });
        }
      }

      // Calculate convertedAmount if group currency differs
      let convertedAmount = numAmount;
      if (groupDoc && groupDoc.currency && groupDoc.currency !== expenseCurrency) {
        try {
          const conv = await convertCurrency(numAmount, expenseCurrency, groupDoc.currency);
          convertedAmount = conv.convertedAmount;
        } catch (convErr) {
          console.warn('Currency conversion error, using original amount:', convErr.message);
          convertedAmount = numAmount;
        }
      }

      const expense = await Expense.create({
        description,
        amount: numAmount,
        currency: expenseCurrency,
        convertedAmount,
        category: category || 'other',
        paidBy: payerId,
        group: groupId || null,
        splitType,
        splits: calculatedSplits,
        notes: notes || '',
        date: date ? new Date(date) : new Date(),
        createdBy: req.user._id,
      });

      await expense.populate('paidBy', 'name email avatar defaultCurrency');
      await expense.populate('splits.user', 'name email avatar defaultCurrency');
      await expense.populate('group', 'name currency type');
      await expense.populate('createdBy', 'name email');

      return res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        expense,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/expenses/:id
// @desc    Get single expense by ID
// @access  Protected
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid expense ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const expense = await Expense.findById(req.params.id)
        .populate('paidBy', 'name email avatar defaultCurrency')
        .populate('splits.user', 'name email avatar defaultCurrency')
        .populate('group', 'name currency type members')
        .populate('createdBy', 'name email');

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
      }

      // Check authorization to view
      const currentUserId = req.user._id.toString();
      const isCreator = getUserIdString(expense.createdBy) === currentUserId;
      const isPayer = getUserIdString(expense.paidBy) === currentUserId;
      const isInSplits = expense.splits.some(
        (s) => getUserIdString(s.user) === currentUserId
      );

      let isGroupMember = false;
      if (expense.group && expense.group.members) {
        isGroupMember = expense.group.members.some(
          (m) => getUserIdString(m.user) === currentUserId
        );
      }

      if (!isCreator && !isPayer && !isInSplits && !isGroupMember) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this expense',
        });
      }

      return res.status(200).json({
        success: true,
        expense,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/expenses/:id
// @desc    Update expense (creator only)
// @access  Protected
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid expense ID'),
    body('description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Description cannot be empty')
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than zero'),
    body('currency')
      .optional()
      .toUpperCase()
      .isIn(SUPPORTED_CURRENCIES)
      .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
    body('category')
      .optional()
      .isIn([
        'food',
        'transport',
        'accommodation',
        'shopping',
        'entertainment',
        'utilities',
        'medical',
        'other',
      ])
      .withMessage('Invalid expense category'),
    body('paidBy')
      .optional()
      .isMongoId()
      .withMessage('Invalid payer user ID'),
    body('splitType')
      .optional()
      .isIn(['equal', 'exact', 'percentage'])
      .withMessage('Invalid split type. Must be equal, exact, or percentage'),
    body('splits')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Splits must be an array with at least one participant'),
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
      const expense = await Expense.findById(req.params.id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
      }

      // Only creator can update
      if (getUserIdString(expense.createdBy) !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the creator of this expense can update it',
        });
      }

      const {
        description,
        amount,
        currency,
        category,
        paidBy,
        splitType,
        splits,
        notes,
        date,
      } = req.body;

      if (description) expense.description = description;
      if (category) expense.category = category;
      if (notes !== undefined) expense.notes = notes;
      if (date) expense.date = new Date(date);

      const newAmount = amount !== undefined ? Math.round(Number(amount) * 100) / 100 : expense.amount;
      const newSplitType = splitType || expense.splitType;
      const newCurrency = currency ? currency.toUpperCase() : expense.currency;

      if (currency) expense.currency = newCurrency;

      // Update payer if provided
      if (paidBy) {
        const payerUser = await User.findById(paidBy);
        if (!payerUser) {
          return res.status(404).json({
            success: false,
            message: 'Payer user not found',
          });
        }

        // If in group, verify new payer is group member
        if (expense.group) {
          const group = await Group.findById(expense.group);
          if (group && !group.members.some((m) => getUserIdString(m.user) === paidBy.toString())) {
            return res.status(400).json({
              success: false,
              message: 'Payer must be a member of the group',
            });
          }
        }
        expense.paidBy = paidBy;
      }

      // Re-validate and recalculate splits if splits or amount or splitType changed
      if (splits || amount !== undefined || splitType) {
        const rawSplitsToProcess = splits || expense.splits;
        let recalculatedSplits;
        try {
          recalculatedSplits = processSplits(newAmount, newSplitType, rawSplitsToProcess);
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        // If group expense, check that all split participants are members
        if (expense.group) {
          const group = await Group.findById(expense.group);
          if (group) {
            for (const s of recalculatedSplits) {
              const isGroupMember = group.members.some(
                (m) => getUserIdString(m.user) === s.user.toString()
              );
              if (!isGroupMember) {
                return res.status(400).json({
                  success: false,
                  message: `Participant ${s.user} is not a member of the group`,
                });
              }
            }
          }
        }

        expense.amount = newAmount;
        expense.splitType = newSplitType;
        expense.splits = recalculatedSplits;
      }

      // Update converted amount if group currency differs
      if (expense.group) {
        const group = await Group.findById(expense.group);
        if (group && group.currency && group.currency !== expense.currency) {
          try {
            const conv = await convertCurrency(expense.amount, expense.currency, group.currency);
            expense.convertedAmount = conv.convertedAmount;
          } catch (convErr) {
            expense.convertedAmount = expense.amount;
          }
        } else {
          expense.convertedAmount = expense.amount;
        }
      } else {
        expense.convertedAmount = expense.amount;
      }

      await expense.save();

      await expense.populate('paidBy', 'name email avatar defaultCurrency');
      await expense.populate('splits.user', 'name email avatar defaultCurrency');
      await expense.populate('group', 'name currency type');
      await expense.populate('createdBy', 'name email');

      return res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        expense,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense (creator only)
// @access  Protected
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid expense ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const expense = await Expense.findById(req.params.id);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
      }

      // Only creator can delete
      if (getUserIdString(expense.createdBy) !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the creator of this expense can delete it',
        });
      }

      await Expense.findByIdAndDelete(expense._id);

      return res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
