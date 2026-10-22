import express from 'express';
import { param, query } from 'express-validator';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { calculateBalances, getUserIdString } from '../utils/balanceCalculator.js';

const router = express.Router();

// All friends routes are protected
router.use(protect);

// @route   GET /api/friends
// @desc    Get all friends (users sharing any group or having 1-on-1 expenses/settlements)
// @access  Protected
router.get('/', async (req, res, next) => {
  try {
    const currentUserId = req.user._id.toString();
    const friendIdSet = new Set();

    // 1. Collect friends from shared groups
    const userGroups = await Group.find({ 'members.user': req.user._id }).select('members.user');
    for (const group of userGroups) {
      for (const m of group.members) {
        const uId = getUserIdString(m.user);
        if (uId && uId !== currentUserId) {
          friendIdSet.add(uId);
        }
      }
    }

    // 2. Collect friends from 1-on-1 expenses (group: null)
    const directExpenses = await Expense.find({
      group: null,
      $or: [{ paidBy: req.user._id }, { 'splits.user': req.user._id }],
    }).select('paidBy splits.user');

    for (const exp of directExpenses) {
      const payerId = getUserIdString(exp.paidBy);
      if (payerId && payerId !== currentUserId) {
        friendIdSet.add(payerId);
      }
      for (const split of exp.splits) {
        const splitUserId = getUserIdString(split.user);
        if (splitUserId && splitUserId !== currentUserId) {
          friendIdSet.add(splitUserId);
        }
      }
    }

    // 3. Collect friends from 1-on-1 settlements (group: null)
    const directSettlements = await Settlement.find({
      group: null,
      $or: [{ from: req.user._id }, { to: req.user._id }],
    }).select('from to');

    for (const set of directSettlements) {
      const fromId = getUserIdString(set.from);
      const toId = getUserIdString(set.to);
      if (fromId && fromId !== currentUserId) friendIdSet.add(fromId);
      if (toId && toId !== currentUserId) friendIdSet.add(toId);
    }

    const friendIds = Array.from(friendIdSet);

    // Fetch friend profiles
    const friends = await User.find({ _id: { $in: friendIds } })
      .select('name email avatar defaultCurrency createdAt')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: friends.length,
      friends,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/friends/search
// @desc    Search users by email or name (query param: q, excludes current user)
// @access  Protected
router.get(
  '/search',
  [
    query('q')
      .trim()
      .notEmpty()
      .withMessage('Search query (q) cannot be empty')
      .isLength({ min: 1, max: 100 })
      .withMessage('Query must be between 1 and 100 characters'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const searchQuery = req.query.q.trim();
      const escapedQuery = searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'i');

      const users = await User.find({
        _id: { $ne: req.user._id },
        $or: [{ email: regex }, { name: regex }],
      })
        .select('name email avatar defaultCurrency')
        .limit(10);

      return res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/friends/:id/balance
// @desc    Get net balance with a specific friend across all shared groups and 1-on-1
// @access  Protected
router.get(
  '/:id/balance',
  [param('id').isMongoId().withMessage('Invalid friend ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const currentUserId = req.user._id.toString();
      const friendId = req.params.id;

      if (currentUserId === friendId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot calculate balance with yourself',
        });
      }

      const friend = await User.findById(friendId).select('name email avatar defaultCurrency');
      if (!friend) {
        return res.status(404).json({
          success: false,
          message: 'Friend not found',
        });
      }

      // Find all groups shared between current user and friend
      const sharedGroups = await Group.find({
        $and: [
          { 'members.user': req.user._id },
          { 'members.user': friend._id },
        ],
      }).select('name currency type');

      const sharedGroupIds = sharedGroups.map((g) => g._id);

      // Fetch all mutual expenses (in shared groups OR 1-on-1)
      const mutualExpenses = await Expense.find({
        $and: [
          {
            $or: [
              { group: null },
              { group: { $in: sharedGroupIds } },
            ],
          },
          {
            $or: [
              { paidBy: req.user._id, 'splits.user': friend._id },
              { paidBy: friend._id, 'splits.user': req.user._id },
            ],
          },
        ],
      })
        .populate('paidBy', 'name email')
        .populate('splits.user', 'name email')
        .populate('group', 'name currency')
        .sort({ date: -1 });

      // Fetch all mutual settlements between current user and friend
      const mutualSettlements = await Settlement.find({
        $or: [
          { from: req.user._id, to: friend._id },
          { from: friend._id, to: req.user._id },
        ],
      })
        .populate('from', 'name email')
        .populate('to', 'name email')
        .populate('group', 'name currency')
        .sort({ date: -1 });

      // Transform mutual expenses into pairwise portions for the balance calculator
      const pairwiseExpenses = [];
      let totalPaidForFriend = 0;
      let totalFriendPaidForMe = 0;

      for (const exp of mutualExpenses) {
        const payerId = getUserIdString(exp.paidBy);
        const isCurrentUserPayer = payerId === currentUserId;
        const isFriendPayer = payerId === friendId;

        if (isCurrentUserPayer) {
          // Find friend's split portion
          const friendSplit = exp.splits.find(
            (s) => getUserIdString(s.user) === friendId
          );
          if (friendSplit && friendSplit.amount > 0) {
            totalPaidForFriend += friendSplit.amount;
            pairwiseExpenses.push({
              _id: exp._id,
              description: exp.description,
              paidBy: req.user._id,
              amount: friendSplit.amount,
              convertedAmount: friendSplit.amount,
              splits: [{ user: friend._id, amount: friendSplit.amount }],
              date: exp.date,
            });
          }
        } else if (isFriendPayer) {
          // Find current user's split portion
          const mySplit = exp.splits.find(
            (s) => getUserIdString(s.user) === currentUserId
          );
          if (mySplit && mySplit.amount > 0) {
            totalFriendPaidForMe += mySplit.amount;
            pairwiseExpenses.push({
              _id: exp._id,
              description: exp.description,
              paidBy: friend._id,
              amount: mySplit.amount,
              convertedAmount: mySplit.amount,
              splits: [{ user: req.user._id, amount: mySplit.amount }],
              date: exp.date,
            });
          }
        }
      }

      // Calculate balance using balanceCalculator
      const balancesResult = calculateBalances(
        pairwiseExpenses,
        mutualSettlements,
        [req.user._id, friend._id]
      );

      const myNet = balancesResult.netBalances[currentUserId] || 0;
      const roundedNet = Math.round(myNet * 100) / 100;

      let status = 'settled';
      if (roundedNet > 0.01) {
        status = 'owes_you';
      } else if (roundedNet < -0.01) {
        status = 'you_owe';
      }

      return res.status(200).json({
        success: true,
        friend: {
          _id: friend._id,
          name: friend.name,
          email: friend.email,
          avatar: friend.avatar,
          defaultCurrency: friend.defaultCurrency,
        },
        netBalance: roundedNet,
        status,
        amount: Math.abs(roundedNet),
        currency: req.user.defaultCurrency || friend.defaultCurrency || 'INR',
        breakdown: {
          totalPaidForFriend: Math.round(totalPaidForFriend * 100) / 100,
          totalFriendPaidForYou: Math.round(totalFriendPaidForMe * 100) / 100,
          simplifiedDebts: balancesResult.simplifiedDebts,
          userBreakdown: balancesResult.userBreakdown,
        },
        sharedGroups,
        recentExpenses: mutualExpenses.slice(0, 10),
        recentSettlements: mutualSettlements.slice(0, 10),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
