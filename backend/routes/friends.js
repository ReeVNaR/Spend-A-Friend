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
 * Helper to compute pairwise net balance between current user and a friend
 * Positive = friend owes current user (credit)
 * Negative = current user owes friend (debt)
 */
const calculateFriendNetBalance = async (currentUserId, friendId) => {
  let netBalance = 0;

  // 1. Shared groups debts
  const sharedGroups = await Group.find({
    $and: [
      { 'members.user': currentUserId },
      { 'members.user': friendId },
    ],
  }).select('members');

  for (const group of sharedGroups) {
    const groupExpenses = await Expense.find({ group: group._id });
    const groupSettlements = await Settlement.find({ group: group._id });
    const bal = calculateBalances(groupExpenses, groupSettlements, group.members);
    if (Array.isArray(bal.simplifiedDebts)) {
      for (const debt of bal.simplifiedDebts) {
        const fromId = getUserIdString(debt.from);
        const toId = getUserIdString(debt.to);
        const amt = Number(debt.amount) || 0;
        if (fromId === currentUserId && toId === friendId) {
          netBalance -= amt;
        } else if (toId === currentUserId && fromId === friendId) {
          netBalance += amt;
        }
      }
    }
  }

  // 2. Direct 1-on-1 expenses (group: null)
  const directExpenses = await Expense.find({
    group: null,
    $or: [
      { paidBy: currentUserId, 'splits.user': friendId },
      { paidBy: friendId, 'splits.user': currentUserId },
    ],
  });

  // 3. Direct 1-on-1 settlements (group: null)
  const directSettlements = await Settlement.find({
    group: null,
    $or: [
      { from: currentUserId, to: friendId },
      { from: friendId, to: currentUserId },
    ],
  });

  const directBal = calculateBalances(directExpenses, directSettlements, [currentUserId, friendId]);
  if (Array.isArray(directBal.simplifiedDebts)) {
    for (const debt of directBal.simplifiedDebts) {
      const fromId = getUserIdString(debt.from);
      const toId = getUserIdString(debt.to);
      const amt = Number(debt.amount) || 0;
      if (fromId === currentUserId && toId === friendId) {
        netBalance -= amt;
      } else if (toId === currentUserId && fromId === friendId) {
        netBalance += amt;
      }
    }
  }

  return Math.round(netBalance * 100) / 100;
};

// @route   GET /api/friends
// @desc    Get all friends with mutual balances
// @access  Protected
router.get('/', async (req, res, next) => {
  try {
    const currentUserId = req.user._id.toString();
    const friendIdSet = new Set();

    // 0. Include explicit friends from current user model
    const currentUser = await User.findById(req.user._id).select('friends');
    if (currentUser?.friends && Array.isArray(currentUser.friends)) {
      for (const fId of currentUser.friends) {
        const strId = getUserIdString(fId);
        if (strId && strId !== currentUserId) {
          friendIdSet.add(strId);
        }
      }
    }

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

    // Calculate mutual balances for each friend
    const friendsWithBalance = await Promise.all(
      friends.map(async (friend) => {
        const bal = await calculateFriendNetBalance(currentUserId, friend._id.toString());
        return {
          ...friend.toObject(),
          balance: bal,
          netBalance: bal,
        };
      })
    );

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
// @desc    Get aggregate balances across all groups and 1-on-1 expenses for dashboard
// @access  Protected
router.get('/balances', async (req, res, next) => {
  try {
    const currentUserId = req.user._id.toString();
    let totalYouOwe = 0;
    let totalOwedToYou = 0;

    // 1. Process all groups where user is a member
    const userGroups = await Group.find({ 'members.user': req.user._id }).select('members');
    for (const group of userGroups) {
      const groupExpenses = await Expense.find({ group: group._id });
      const groupSettlements = await Settlement.find({ group: group._id });

      const bal = calculateBalances(groupExpenses, groupSettlements, group.members);
      if (Array.isArray(bal.simplifiedDebts)) {
        for (const debt of bal.simplifiedDebts) {
          const fromId = getUserIdString(debt.from);
          const toId = getUserIdString(debt.to);
          const amount = Number(debt.amount) || 0;

          if (fromId === currentUserId && amount > 0) {
            totalYouOwe += amount;
          } else if (toId === currentUserId && amount > 0) {
            totalOwedToYou += amount;
          }
        }
      }
    }

    // 2. Process all direct 1-on-1 expenses & settlements (group: null)
    const directExpenses = await Expense.find({
      group: null,
      $or: [{ paidBy: req.user._id }, { 'splits.user': req.user._id }],
    });
    const directSettlements = await Settlement.find({
      group: null,
      $or: [{ from: req.user._id }, { to: req.user._id }],
    });

    const directBal = calculateBalances(directExpenses, directSettlements);
    if (Array.isArray(directBal.simplifiedDebts)) {
      for (const debt of directBal.simplifiedDebts) {
        const fromId = getUserIdString(debt.from);
        const toId = getUserIdString(debt.to);
        const amount = Number(debt.amount) || 0;

        if (fromId === currentUserId && amount > 0) {
          totalYouOwe += amount;
        } else if (toId === currentUserId && amount > 0) {
          totalOwedToYou += amount;
        }
      }
    }

    const roundedYouOwe = Math.round(totalYouOwe * 100) / 100;
    const roundedOwedToYou = Math.round(totalOwedToYou * 100) / 100;
    const netBalance = Math.round((roundedOwedToYou - roundedYouOwe) * 100) / 100;

    return res.status(200).json({
      success: true,
      youOwe: roundedYouOwe,
      owedToYou: roundedOwedToYou,
      netBalance,
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
