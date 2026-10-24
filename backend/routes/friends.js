import express from 'express';
import { body, param, query } from 'express-validator';
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

/**
 * Ultra-fast batch calculation of balances across all user groups and 1-on-1 direct debts.
 * Executes ONLY 3 optimized batch queries total, then calculates everything in-memory.
 */
const calculateUserAggregateData = async (currentUserId) => {
  // 1. Fetch all groups current user is a member of (Indexed)
  const userGroups = await Group.find({ 'members.user': currentUserId })
    .select('name currency members')
    .lean();

  const userGroupIds = userGroups.map((g) => g._id);

  // 2. Fetch all expenses related to current user in a single indexed query
  const allExpenses = await Expense.find({
    $or: [
      { group: { $in: userGroupIds } },
      { group: null, $or: [{ paidBy: currentUserId }, { 'splits.user': currentUserId }] },
    ],
  }).lean();

  // 3. Fetch all settlements related to current user in a single indexed query
  const allSettlements = await Settlement.find({
    $or: [
      { group: { $in: userGroupIds } },
      { group: null, $or: [{ from: currentUserId }, { to: currentUserId }] },
    ],
  }).lean();

  // Group expenses and settlements by groupId
  const expensesByGroup = new Map();
  const directExpenses = [];
  for (const exp of allExpenses) {
    if (exp.group) {
      const gId = exp.group.toString();
      if (!expensesByGroup.has(gId)) expensesByGroup.set(gId, []);
      expensesByGroup.get(gId).push(exp);
    } else {
      directExpenses.push(exp);
    }
  }

  const settlementsByGroup = new Map();
  const directSettlements = [];
  for (const set of allSettlements) {
    if (set.group) {
      const gId = set.group.toString();
      if (!settlementsByGroup.has(gId)) settlementsByGroup.set(gId, []);
      settlementsByGroup.get(gId).push(set);
    } else {
      directSettlements.push(set);
    }
  }

  let totalYouOwe = 0;
  let totalOwedToYou = 0;
  const friendBalances = new Map();

  const recordDebt = (fromId, toId, amount) => {
    if (fromId === currentUserId && amount > 0) {
      totalYouOwe += amount;
      friendBalances.set(toId, (friendBalances.get(toId) || 0) - amount);
    } else if (toId === currentUserId && amount > 0) {
      totalOwedToYou += amount;
      friendBalances.set(fromId, (friendBalances.get(fromId) || 0) + amount);
    }
  };

  // A. Process each group's debts in memory
  for (const group of userGroups) {
    const gId = group._id.toString();
    const gExpenses = expensesByGroup.get(gId) || [];
    const gSettlements = settlementsByGroup.get(gId) || [];

    if (gExpenses.length === 0 && gSettlements.length === 0) continue;

    const bal = calculateBalances(gExpenses, gSettlements, group.members);
    if (Array.isArray(bal.simplifiedDebts)) {
      for (const debt of bal.simplifiedDebts) {
        const fromId = getUserIdString(debt.from);
        const toId = getUserIdString(debt.to);
        const amount = Number(debt.amount) || 0;
        recordDebt(fromId, toId, amount);
      }
    }
  }

  // B. Process direct 1-on-1 debts in memory
  if (directExpenses.length > 0 || directSettlements.length > 0) {
    const directBal = calculateBalances(directExpenses, directSettlements);
    if (Array.isArray(directBal.simplifiedDebts)) {
      for (const debt of directBal.simplifiedDebts) {
        const fromId = getUserIdString(debt.from);
        const toId = getUserIdString(debt.to);
        const amount = Number(debt.amount) || 0;
        recordDebt(fromId, toId, amount);
      }
    }
  }

  const roundedYouOwe = Math.round(totalYouOwe * 100) / 100;
  const roundedOwedToYou = Math.round(totalOwedToYou * 100) / 100;
  const netBalance = Math.round((roundedOwedToYou - roundedYouOwe) * 100) / 100;

  return {
    youOwe: roundedYouOwe,
    owedToYou: roundedOwedToYou,
    netBalance,
    friendBalances,
    userGroups,
    allExpenses,
    allSettlements,
  };
};

// @route   GET /api/friends
// @desc    Get all friends with mutual balances (High Performance Batch Mode)
// @access  Protected
router.get('/', async (req, res, next) => {
  try {
    const currentUserId = req.user._id.toString();

    // Run batch aggregate calculation in memory
    const agg = await calculateUserAggregateData(currentUserId);

    const friendIdSet = new Set();

    // 0. Include explicit friends from user model
    const currentUser = await User.findById(req.user._id).select('friends').lean();
    if (currentUser?.friends && Array.isArray(currentUser.friends)) {
      for (const fId of currentUser.friends) {
        const strId = getUserIdString(fId);
        if (strId && strId !== currentUserId) {
          friendIdSet.add(strId);
        }
      }
    }

    // 1. Collect friends from shared groups
    for (const group of agg.userGroups) {
      if (group.members) {
        for (const m of group.members) {
          const uId = getUserIdString(m.user || m);
          if (uId && uId !== currentUserId) {
            friendIdSet.add(uId);
          }
        }
      }
    }

    // 2. Collect friends from direct expenses
    for (const exp of agg.allExpenses) {
      if (!exp.group) {
        const payerId = getUserIdString(exp.paidBy);
        if (payerId && payerId !== currentUserId) friendIdSet.add(payerId);
        if (Array.isArray(exp.splits)) {
          for (const s of exp.splits) {
            const splitId = getUserIdString(s.user);
            if (splitId && splitId !== currentUserId) friendIdSet.add(splitId);
          }
        }
      }
    }

    // 3. Collect friends from direct settlements
    for (const set of agg.allSettlements) {
      if (!set.group) {
        const fromId = getUserIdString(set.from);
        const toId = getUserIdString(set.to);
        if (fromId && fromId !== currentUserId) friendIdSet.add(fromId);
        if (toId && toId !== currentUserId) friendIdSet.add(toId);
      }
    }

    const friendIds = Array.from(friendIdSet);

    // Fetch friend profiles in 1 query
    const friends = await User.find({ _id: { $in: friendIds } })
      .select('name email avatar defaultCurrency upiId createdAt')
      .sort({ name: 1 })
      .lean();

    // Map mutual balances from pre-computed in-memory Map (0ms)
    const friendsWithBalance = friends.map((friend) => {
      const fId = friend._id.toString();
      const bal = Math.round((agg.friendBalances.get(fId) || 0) * 100) / 100;
      return {
        ...friend,
        balance: bal,
        netBalance: bal,
      };
    });

    return res.status(200).json({
      success: true,
      count: friendsWithBalance.length,
      friends: friendsWithBalance,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/friends/balances
// @desc    Get aggregate balances across all groups and 1-on-1 expenses for dashboard (Instant 0-wait)
// @access  Protected
router.get('/balances', async (req, res, next) => {
  try {
    const currentUserId = req.user._id.toString();
    const agg = await calculateUserAggregateData(currentUserId);

    return res.status(200).json({
      success: true,
      youOwe: agg.youOwe,
      owedToYou: agg.owedToYou,
      netBalance: agg.netBalance,
      currency: req.user.defaultCurrency || 'INR',
    });
  } catch (error) {
    next(error);
  }
});

// Helper for adding friend by email
const handleAddFriend = async (req, res, next) => {
  try {
    const rawEmail = (req.body.email || '').trim().toLowerCase();
    if (!rawEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(rawEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (rawEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add yourself as a friend',
      });
    }

    let targetUser = await User.findOne({ email: rawEmail });
    if (!targetUser) {
      // Auto-create account for friend so user can immediately split bills
      const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      const namePart = rawEmail.split('@')[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      targetUser = await User.create({
        name: displayName,
        email: rawEmail,
        password: tempPassword,
        defaultCurrency: req.user.defaultCurrency || 'INR',
      });
    }

    // Add to current user's friends list
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.friends) currentUser.friends = [];
    const alreadyFriend = currentUser.friends.some(
      (f) => f.toString() === targetUser._id.toString()
    );
    if (!alreadyFriend) {
      currentUser.friends.push(targetUser._id);
      await currentUser.save();
    }

    // Mutually add to target user's friends list
    if (!targetUser.friends) targetUser.friends = [];
    const alreadyTargetFriend = targetUser.friends.some(
      (f) => f.toString() === currentUser._id.toString()
    );
    if (!alreadyTargetFriend) {
      targetUser.friends.push(currentUser._id);
      await targetUser.save();
    }

    return res.status(200).json({
      success: true,
      message: `${targetUser.name} added as a friend successfully`,
      friend: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar,
        balance: 0,
      },
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar,
        balance: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/friends/add
// @route   POST /api/friends
// @desc    Add a friend by email
// @access  Protected
router.post('/add', handleAddFriend);
router.post('/', handleAddFriend);

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

      // Shared groups
      const sharedGroups = await Group.find({
        $and: [
          { 'members.user': req.user._id },
          { 'members.user': friend._id },
        ],
      }).select('name currency type');

      const sharedGroupIds = sharedGroups.map((g) => g._id);

      // Mutual expenses
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
        .populate('paidBy', 'name email avatar')
        .populate('splits.user', 'name email avatar')
        .populate('group', 'name currency type')
        .sort({ date: -1, createdAt: -1 });

      // Mutual settlements
      const mutualSettlements = await Settlement.find({
        $or: [
          { from: req.user._id, to: friend._id },
          { from: friend._id, to: req.user._id },
        ],
      })
        .populate('from', 'name email avatar')
        .populate('to', 'name email avatar')
        .populate('group', 'name currency type')
        .sort({ date: -1, createdAt: -1 });

      const pairwiseExpenses = [];
      let totalPaidForFriend = 0;
      let totalFriendPaidForMe = 0;

      for (const exp of mutualExpenses) {
        const payerId = getUserIdString(exp.paidBy);
        if (payerId === currentUserId) {
          const friendSplit = exp.splits.find((s) => getUserIdString(s.user) === friendId);
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
        } else if (payerId === friendId) {
          const mySplit = exp.splits.find((s) => getUserIdString(s.user) === currentUserId);
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

      const balancesResult = calculateBalances(pairwiseExpenses, mutualSettlements, [
        req.user._id,
        friend._id,
      ]);

      const myNet = balancesResult.netBalances[currentUserId] || 0;
      const roundedNet = Math.round(myNet * 100) / 100;

      let status = 'settled';
      if (roundedNet > 0.01) status = 'owes_you';
      else if (roundedNet < -0.01) status = 'you_owe';

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

// @route   GET /api/friends/:id
// @desc    Get friend profile, mutual expenses, mutual settlements and balance for FriendDetailPage
// @access  Protected
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid friend ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const currentUserId = req.user._id.toString();
      const friendId = req.params.id;

      if (currentUserId === friendId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot view profile of yourself as a friend',
        });
      }

      const friend = await User.findById(friendId)
        .select('name email avatar defaultCurrency upiId createdAt')
        .lean();

      if (!friend) {
        return res.status(404).json({
          success: false,
          message: 'Friend not found',
        });
      }

      // Shared groups
      const sharedGroups = await Group.find({
        $and: [
          { 'members.user': req.user._id },
          { 'members.user': friend._id },
        ],
      }).select('name currency type').lean();

      const sharedGroupIds = sharedGroups.map((g) => g._id);

      // Mutual expenses
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
        .populate('paidBy', 'name email avatar')
        .populate('splits.user', 'name email avatar')
        .populate('group', 'name currency type')
        .sort({ date: -1, createdAt: -1 });

      // Mutual settlements
      const mutualSettlements = await Settlement.find({
        $or: [
          { from: req.user._id, to: friend._id },
          { from: friend._id, to: req.user._id },
        ],
      })
        .populate('from', 'name email avatar')
        .populate('to', 'name email avatar')
        .populate('group', 'name currency type')
        .sort({ date: -1, createdAt: -1 });

      // Pairwise balance calculation
      const pairwiseExpenses = [];
      for (const exp of mutualExpenses) {
        const payerId = getUserIdString(exp.paidBy);
        if (payerId === currentUserId) {
          const friendSplit = exp.splits.find((s) => getUserIdString(s.user) === friendId);
          if (friendSplit && friendSplit.amount > 0) {
            pairwiseExpenses.push({
              _id: exp._id,
              paidBy: req.user._id,
              amount: friendSplit.amount,
              splits: [{ user: friend._id, amount: friendSplit.amount }],
            });
          }
        } else if (payerId === friendId) {
          const mySplit = exp.splits.find((s) => getUserIdString(s.user) === currentUserId);
          if (mySplit && mySplit.amount > 0) {
            pairwiseExpenses.push({
              _id: exp._id,
              paidBy: friend._id,
              amount: mySplit.amount,
              splits: [{ user: req.user._id, amount: mySplit.amount }],
            });
          }
        }
      }

      const balResult = calculateBalances(pairwiseExpenses, mutualSettlements, [
        req.user._id,
        friend._id,
      ]);

      const myNet = balResult.netBalances[currentUserId] || 0;
      const roundedNet = Math.round(myNet * 100) / 100;

      let status = 'settled';
      if (roundedNet > 0.01) status = 'owes_you';
      else if (roundedNet < -0.01) status = 'you_owe';

      return res.status(200).json({
        success: true,
        friend: {
          _id: friend._id,
          name: friend.name,
          email: friend.email,
          avatar: friend.avatar,
          defaultCurrency: friend.defaultCurrency,
          createdAt: friend.createdAt,
        },
        balance: roundedNet,
        netBalance: roundedNet,
        status,
        currency: req.user.defaultCurrency || friend.defaultCurrency || 'INR',
        expenses: mutualExpenses,
        settlements: mutualSettlements,
        sharedGroups,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/friends/:id
// @desc    Remove friend from user's friends list
// @access  Protected
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid friend ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const friendId = req.params.id;
      const user = await User.findById(req.user._id);

      if (user.friends && Array.isArray(user.friends)) {
        user.friends = user.friends.filter((f) => f.toString() !== friendId);
        await user.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Friend removed from your friends list',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
