import { calculateBalances } from '../utils/balanceCalculator';

const STORAGE_KEYS = {
  USERS: 'saf_users',
  GROUPS: 'saf_groups',
  EXPENSES: 'saf_expenses',
  SETTLEMENTS: 'saf_settlements',
  CURRENT_USER: 'saf_current_user',
  TOKEN: 'token',
};

// Unique ID generator
const generateId = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

// Generate 6-char group invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Initial Demo Seed Data
const getInitialSeed = () => {
  const me = {
    _id: 'usr_me',
    id: 'usr_me',
    name: 'Ranveer',
    email: 'ranveer@example.com',
    password: 'password123',
    defaultCurrency: 'INR',
    avatar: '',
    createdAt: new Date().toISOString(),
  };

  const maya = {
    _id: 'usr_maya',
    id: 'usr_maya',
    name: 'Maya Lin',
    email: 'maya@example.com',
    defaultCurrency: 'INR',
    avatar: '',
    createdAt: new Date().toISOString(),
  };

  const alex = {
    _id: 'usr_alex',
    id: 'usr_alex',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    defaultCurrency: 'INR',
    avatar: '',
    createdAt: new Date().toISOString(),
  };

  const sam = {
    _id: 'usr_sam',
    id: 'usr_sam',
    name: 'Sam Chen',
    email: 'sam@example.com',
    defaultCurrency: 'INR',
    avatar: '',
    createdAt: new Date().toISOString(),
  };

  const users = [me, maya, alex, sam];

  const groupTrip = {
    _id: 'grp_goa',
    id: 'grp_goa',
    name: 'Goa Beach Trip 🏖️',
    description: 'Shared expenses for flights, beach villa, rentals & dinners in North Goa',
    type: 'trip',
    currency: 'INR',
    inviteCode: 'GOA2026',
    createdBy: me._id,
    members: [
      { user: me._id, role: 'admin', joinedAt: new Date().toISOString() },
      { user: maya._id, role: 'member', joinedAt: new Date().toISOString() },
      { user: alex._id, role: 'member', joinedAt: new Date().toISOString() },
      { user: sam._id, role: 'member', joinedAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  };

  const groupHome = {
    _id: 'grp_apt',
    id: 'grp_apt',
    name: 'Apartment 204 🏠',
    description: 'Rent, groceries, high-speed WiFi, electricity & maintenance',
    type: 'home',
    currency: 'INR',
    inviteCode: 'APT204',
    createdBy: me._id,
    members: [
      { user: me._id, role: 'admin', joinedAt: new Date().toISOString() },
      { user: alex._id, role: 'member', joinedAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  };

  const groups = [groupTrip, groupHome];

  const expenses = [
    {
      _id: 'exp_1',
      id: 'exp_1',
      description: 'Beachfront Villa Booking',
      amount: 12000,
      currency: 'INR',
      category: 'accommodation',
      paidBy: me._id,
      group: groupTrip._id,
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      splitType: 'equal',
      splits: [
        { user: me._id, amount: 3000 },
        { user: maya._id, amount: 3000 },
        { user: alex._id, amount: 3000 },
        { user: sam._id, amount: 3000 },
      ],
      notes: 'Paid via credit card for 3 nights stay',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      _id: 'exp_2',
      id: 'exp_2',
      description: 'Sunset Seafood Dinner',
      amount: 4800,
      currency: 'INR',
      category: 'food',
      paidBy: maya._id,
      group: groupTrip._id,
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      splitType: 'equal',
      splits: [
        { user: me._id, amount: 1200 },
        { user: maya._id, amount: 1200 },
        { user: alex._id, amount: 1200 },
        { user: sam._id, amount: 1200 },
      ],
      notes: 'Dinner at Thalassa Anjuna',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      _id: 'exp_3',
      id: 'exp_3',
      description: 'High-speed Fiber WiFi',
      amount: 1500,
      currency: 'INR',
      category: 'utilities',
      paidBy: alex._id,
      group: groupHome._id,
      date: new Date(Date.now() - 1 * 86400000).toISOString(),
      splitType: 'equal',
      splits: [
        { user: me._id, amount: 750 },
        { user: alex._id, amount: 750 },
      ],
      notes: 'Monthly 300 Mbps unlimited plan',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      _id: 'exp_4',
      id: 'exp_4',
      description: 'Weekly Organic Groceries',
      amount: 2400,
      currency: 'INR',
      category: 'shopping',
      paidBy: me._id,
      group: groupHome._id,
      date: new Date().toISOString(),
      splitType: 'equal',
      splits: [
        { user: me._id, amount: 1200 },
        { user: alex._id, amount: 1200 },
      ],
      notes: 'Fruits, vegetables, dairy and essentials',
      createdAt: new Date().toISOString(),
    },
  ];

  const settlements = [
    {
      _id: 'set_1',
      id: 'set_1',
      from: alex._id,
      to: me._id,
      amount: 1000,
      currency: 'INR',
      group: groupTrip._id,
      date: new Date(Date.now() - 86400000).toISOString(),
      notes: 'UPI transfer for initial trip advance',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  return { users, groups, expenses, settlements, currentUser: me };
};

// Storage Helpers
class FrontendStore {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    try {
      const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!existingUsers) {
        const seed = getInitialSeed();
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seed.users));
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(seed.groups));
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(seed.expenses));
        localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(seed.settlements));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(seed.currentUser));
        localStorage.setItem(STORAGE_KEYS.TOKEN, 'local_token_spend_a_friend');
        localStorage.setItem('user', JSON.stringify(seed.currentUser));
      }
    } catch (err) {
      console.warn('Storage initialization error:', err);
    }
  }

  getCollection(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  }

  setCollection(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error(`Failed to save ${key} to localStorage:`, err);
    }
  }

  // Current User Helpers
  getCurrentUser() {
    try {
      const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.TOKEN, `token_${user._id || user.id}`);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('user');
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  // Populate helper to replace IDs with User objects
  populateUser(userId) {
    if (!userId) return null;
    if (typeof userId === 'object' && userId.name) return userId;
    const users = this.getCollection(STORAGE_KEYS.USERS);
    const found = users.find((u) => u._id === userId || u.id === userId);
    return found || { _id: userId, id: userId, name: 'Friend', email: '' };
  }

  populateGroup(groupId) {
    if (!groupId) return null;
    if (typeof groupId === 'object' && groupId.name) return groupId;
    const groups = this.getCollection(STORAGE_KEYS.GROUPS);
    return groups.find((g) => g._id === groupId || g.id === groupId) || null;
  }

  // AUTH
  register(name, email, password, defaultCurrency = 'INR') {
    const users = this.getCollection(STORAGE_KEYS.USERS);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const newUser = {
      _id: generateId('usr'),
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      defaultCurrency: defaultCurrency || 'INR',
      avatar: '',
      createdAt: new Date().toISOString(),
    };
    newUser.id = newUser._id;

    users.push(newUser);
    this.setCollection(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(newUser);

    return {
      success: true,
      token: `token_${newUser._id}`,
      user: newUser,
    };
  }

  login(email, password) {
    const users = this.getCollection(STORAGE_KEYS.USERS);
    const normalizedEmail = email.trim().toLowerCase();

    let user = users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (!user) {
      // Auto-create or reject
      throw new Error('Invalid email or password');
    }

    if (user.password && user.password !== password) {
      throw new Error('Incorrect password');
    }

    user.id = user._id;
    this.setCurrentUser(user);

    return {
      success: true,
      token: `token_${user._id}`,
      user,
    };
  }

  getMe() {
    const current = this.getCurrentUser();
    if (!current) {
      throw new Error('Not authenticated');
    }
    const users = this.getCollection(STORAGE_KEYS.USERS);
    const user = users.find((u) => u._id === (current._id || current.id)) || current;
    user.id = user._id;
    return { success: true, user };
  }

  updateProfile(data) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not authenticated');

    const users = this.getCollection(STORAGE_KEYS.USERS);
    const index = users.findIndex((u) => u._id === (current._id || current.id));

    if (index === -1) throw new Error('User not found');

    users[index] = { ...users[index], ...data };
    users[index].id = users[index]._id;

    this.setCollection(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(users[index]);

    return { success: true, user: users[index] };
  }

  // GROUPS
  getGroups() {
    const current = this.getCurrentUser();
    if (!current) return { success: true, groups: [] };
    const myId = String(current._id || current.id);

    const groups = this.getCollection(STORAGE_KEYS.GROUPS);

    // Filter groups where user is a member
    const myGroups = groups.filter((g) =>
      g.members?.some((m) => String(m.user?._id || m.user?.id || m.user) === myId)
    );

    // Populate members
    const populated = myGroups.map((g) => ({
      ...g,
      members: g.members.map((m) => ({
        ...m,
        user: this.populateUser(m.user?._id || m.user?.id || m.user),
      })),
    }));

    return { success: true, groups: populated };
  }

  getGroupById(id) {
    const groups = this.getCollection(STORAGE_KEYS.GROUPS);
    const group = groups.find((g) => g._id === id || g.id === id);

    if (!group) throw new Error('Group not found');

    const populated = {
      ...group,
      members: group.members.map((m) => ({
        ...m,
        user: this.populateUser(m.user?._id || m.user?.id || m.user),
      })),
    };

    return { success: true, group: populated };
  }

  createGroup(data) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not authenticated');
    const myId = current._id || current.id;

    const groups = this.getCollection(STORAGE_KEYS.GROUPS);
    const newGroup = {
      _id: generateId('grp'),
      name: data.name.trim(),
      description: data.description ? data.description.trim() : '',
      type: data.type || 'trip',
      currency: data.currency || current.defaultCurrency || 'INR',
      inviteCode: generateInviteCode(),
      createdBy: myId,
      members: [
        {
          user: myId,
          role: 'admin',
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };
    newGroup.id = newGroup._id;

    groups.unshift(newGroup);
    this.setCollection(STORAGE_KEYS.GROUPS, groups);

    return {
      success: true,
      group: {
        ...newGroup,
        members: [{ user: current, role: 'admin', joinedAt: new Date().toISOString() }],
      },
    };
  }

  joinGroup(inviteCode) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not authenticated');
    const myId = String(current._id || current.id);

    const cleanCode = inviteCode.trim().toUpperCase();
    const groups = this.getCollection(STORAGE_KEYS.GROUPS);

    const group = groups.find((g) => g.inviteCode?.toUpperCase() === cleanCode);
    if (!group) {
      throw new Error('Invalid invite code. No group found.');
    }

    const alreadyMember = group.members?.some(
      (m) => String(m.user?._id || m.user?.id || m.user) === myId
    );

    if (alreadyMember) {
      return { success: true, group, message: 'You are already a member of this group' };
    }

    group.members.push({
      user: myId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });

    this.setCollection(STORAGE_KEYS.GROUPS, groups);

    return {
      success: true,
      group: {
        ...group,
        members: group.members.map((m) => ({
          ...m,
          user: this.populateUser(m.user?._id || m.user?.id || m.user),
        })),
      },
    };
  }

  getGroupBalances(groupId) {
    const groups = this.getCollection(STORAGE_KEYS.GROUPS);
    const group = groups.find((g) => g._id === groupId || g.id === groupId);
    if (!group) throw new Error('Group not found');

    const expenses = this.getCollection(STORAGE_KEYS.EXPENSES).filter(
      (e) => (e.group?._id || e.group?.id || e.group) === groupId
    );

    const settlements = this.getCollection(STORAGE_KEYS.SETTLEMENTS).filter(
      (s) => (s.group?._id || s.group?.id || s.group) === groupId
    );

    const memberIds = group.members?.map((m) => m.user?._id || m.user?.id || m.user) || [];

    const balances = calculateBalances(expenses, settlements, memberIds);

    return {
      success: true,
      balances,
      simplifiedDebts: balances.simplifiedDebts,
      members: group.members.map((m) => this.populateUser(m.user?._id || m.user?.id || m.user)),
    };
  }

  // EXPENSES
  getExpenses(params = {}) {
    let list = this.getCollection(STORAGE_KEYS.EXPENSES);
    const current = this.getCurrentUser();
    const myId = current ? String(current._id || current.id) : null;

    if (params.group || params.groupId) {
      const gId = params.group || params.groupId;
      list = list.filter((e) => String(e.group?._id || e.group?.id || e.group) === String(gId));
    } else if (params.friend || params.friendId) {
      const fId = String(params.friend || params.friendId);
      list = list.filter((e) => {
        // Individual expense between current user and friend
        const payerId = String(e.paidBy?._id || e.paidBy?.id || e.paidBy);
        const splitUserIds = (e.splits || []).map((s) => String(s.user?._id || s.user?.id || s.user));
        return (
          (payerId === myId && splitUserIds.includes(fId)) ||
          (payerId === fId && splitUserIds.includes(myId))
        );
      });
    }

    // Sort by date descending
    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    // Limit if requested
    if (params.limit) {
      list = list.slice(0, parseInt(params.limit, 10));
    }

    // Populate fields
    const populated = list.map((e) => ({
      ...e,
      paidBy: this.populateUser(e.paidBy?._id || e.paidBy?.id || e.paidBy),
      group: this.populateGroup(e.group?._id || e.group?.id || e.group),
      splits: (e.splits || []).map((s) => ({
        ...s,
        user: this.populateUser(s.user?._id || s.user?.id || s.user),
      })),
    }));

    return { success: true, expenses: populated };
  }

  createExpense(data) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not authenticated');

    const expenses = this.getCollection(STORAGE_KEYS.EXPENSES);

    const newExpense = {
      _id: generateId('exp'),
      description: data.description.trim(),
      amount: Number(data.amount),
      currency: data.currency || current.defaultCurrency || 'INR',
      category: data.category || 'other',
      paidBy: data.paidBy || current._id || current.id,
      group: data.group || null,
      date: data.date || new Date().toISOString(),
      splitType: data.splitType || 'equal',
      splits: (data.splits || []).map((s) => ({
        user: s.user?._id || s.user?.id || s.user,
        amount: Number(s.amount),
        percentage: s.percentage,
      })),
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    newExpense.id = newExpense._id;

    expenses.unshift(newExpense);
    this.setCollection(STORAGE_KEYS.EXPENSES, expenses);

    return {
      success: true,
      expense: {
        ...newExpense,
        paidBy: this.populateUser(newExpense.paidBy),
        group: this.populateGroup(newExpense.group),
        splits: newExpense.splits.map((s) => ({
          ...s,
          user: this.populateUser(s.user),
        })),
      },
    };
  }

  deleteExpense(id) {
    const expenses = this.getCollection(STORAGE_KEYS.EXPENSES);
    const filtered = expenses.filter((e) => e._id !== id && e.id !== id);
    this.setCollection(STORAGE_KEYS.EXPENSES, filtered);
    return { success: true, message: 'Expense deleted successfully' };
  }

  // SETTLEMENTS
  getSettlements(params = {}) {
    let list = this.getCollection(STORAGE_KEYS.SETTLEMENTS);
    const current = this.getCurrentUser();
    const myId = current ? String(current._id || current.id) : null;

    if (params.group || params.groupId) {
      const gId = params.group || params.groupId;
      list = list.filter((s) => String(s.group?._id || s.group?.id || s.group) === String(gId));
    } else if (params.user || params.userId) {
      const uId = String(params.user || params.userId);
      list = list.filter((s) => {
        const fromId = String(s.from?._id || s.from?.id || s.from);
        const toId = String(s.to?._id || s.to?.id || s.to);
        return (fromId === myId && toId === uId) || (fromId === uId && toId === myId);
      });
    }

    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const populated = list.map((s) => ({
      ...s,
      from: this.populateUser(s.from?._id || s.from?.id || s.from),
      to: this.populateUser(s.to?._id || s.to?.id || s.to),
      group: this.populateGroup(s.group?._id || s.group?.id || s.group),
    }));

    return { success: true, settlements: populated };
  }

  createSettlement(data) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not authenticated');
    const myId = current._id || current.id;

    const settlements = this.getCollection(STORAGE_KEYS.SETTLEMENTS);

    const newSettlement = {
      _id: generateId('set'),
      from: data.from || myId,
      to: data.to?._id || data.to?.id || data.to,
      amount: Number(data.amount),
      currency: data.currency || current.defaultCurrency || 'INR',
      group: data.group || null,
      date: data.date || new Date().toISOString(),
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };
    newSettlement.id = newSettlement._id;

    settlements.unshift(newSettlement);
    this.setCollection(STORAGE_KEYS.SETTLEMENTS, settlements);

    return {
      success: true,
      settlement: {
        ...newSettlement,
        from: this.populateUser(newSettlement.from),
        to: this.populateUser(newSettlement.to),
        group: this.populateGroup(newSettlement.group),
      },
    };
  }

  deleteSettlement(id) {
    const settlements = this.getCollection(STORAGE_KEYS.SETTLEMENTS);
    const filtered = settlements.filter((s) => s._id !== id && s.id !== id);
    this.setCollection(STORAGE_KEYS.SETTLEMENTS, filtered);
    return { success: true, message: 'Settlement deleted' };
  }

  // FRIENDS & BALANCES
  getFriends() {
    const current = this.getCurrentUser();
    if (!current) return { success: true, friends: [] };
    const myId = String(current._id || current.id);

    const users = this.getCollection(STORAGE_KEYS.USERS);
    const expenses = this.getCollection(STORAGE_KEYS.EXPENSES);
    const settlements = this.getCollection(STORAGE_KEYS.SETTLEMENTS);

    // Filter all other users as potential friends
    const otherUsers = users.filter((u) => String(u._id || u.id) !== myId);

    const friendsWithBalances = otherUsers.map((friend) => {
      const fId = String(friend._id || friend.id);

      // Filter all shared expenses & settlements
      const sharedExpenses = expenses.filter((e) => {
        const payerId = String(e.paidBy?._id || e.paidBy?.id || e.paidBy);
        const splitIds = (e.splits || []).map((s) => String(s.user?._id || s.user?.id || s.user));
        return (
          (payerId === myId && splitIds.includes(fId)) ||
          (payerId === fId && splitIds.includes(myId))
        );
      });

      const sharedSettlements = settlements.filter((s) => {
        const fromId = String(s.from?._id || s.from?.id || s.from);
        const toId = String(s.to?._id || s.to?.id || s.to);
        return (fromId === myId && toId === fId) || (fromId === fId && toId === myId);
      });

      const bal = calculateBalances(sharedExpenses, sharedSettlements, [myId, fId]);
      const net = bal.netBalances[fId] !== undefined ? -bal.netBalances[fId] : 0;

      return {
        _id: friend._id,
        id: friend._id,
        name: friend.name,
        email: friend.email,
        avatar: friend.avatar,
        balance: Math.round(net * 100) / 100,
      };
    });

    return { success: true, friends: friendsWithBalances };
  }

  getFriendDetails(friendId) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Not authenticated');
    const myId = String(current._id || current.id);
    const fId = String(friendId);

    const friend = this.populateUser(friendId);
    if (!friend) throw new Error('Friend not found');

    const expenses = this.getCollection(STORAGE_KEYS.EXPENSES).filter((e) => {
      const payerId = String(e.paidBy?._id || e.paidBy?.id || e.paidBy);
      const splitIds = (e.splits || []).map((s) => String(s.user?._id || s.user?.id || s.user));
      return (
        (payerId === myId && splitIds.includes(fId)) ||
        (payerId === fId && splitIds.includes(myId))
      );
    });

    const settlements = this.getCollection(STORAGE_KEYS.SETTLEMENTS).filter((s) => {
      const fromId = String(s.from?._id || s.from?.id || s.from);
      const toId = String(s.to?._id || s.to?.id || s.to);
      return (fromId === myId && toId === fId) || (fromId === fId && toId === myId);
    });

    const bal = calculateBalances(expenses, settlements, [myId, fId]);
    const net = bal.netBalances[fId] !== undefined ? -bal.netBalances[fId] : 0;

    const populatedExpenses = expenses.map((e) => ({
      ...e,
      paidBy: this.populateUser(e.paidBy),
      group: this.populateGroup(e.group),
    }));

    const populatedSettlements = settlements.map((s) => ({
      ...s,
      from: this.populateUser(s.from),
      to: this.populateUser(s.to),
    }));

    return {
      success: true,
      friend,
      balance: Math.round(net * 100) / 100,
      expenses: populatedExpenses,
      settlements: populatedSettlements,
    };
  }

  addFriend(email) {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getCollection(STORAGE_KEYS.USERS);
    const current = this.getCurrentUser();

    if (current && cleanEmail === current.email?.toLowerCase()) {
      throw new Error("You cannot add yourself as a friend");
    }

    let friend = users.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!friend) {
      // Auto-create a friend user with a generated name from email
      const namePart = cleanEmail.split('@')[0];
      const friendlyName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      friend = {
        _id: generateId('usr'),
        name: friendlyName,
        email: cleanEmail,
        defaultCurrency: current?.defaultCurrency || 'INR',
        avatar: '',
        createdAt: new Date().toISOString(),
      };
      friend.id = friend._id;
      users.push(friend);
      this.setCollection(STORAGE_KEYS.USERS, users);
    }

    return {
      success: true,
      message: `${friend.name} added to friends!`,
      friend,
    };
  }

  getDashboardBalances() {
    const { friends } = this.getFriends();
    let owe = 0;
    let owed = 0;

    friends.forEach((f) => {
      const b = Number(f.balance || 0);
      if (b < 0) owe += Math.abs(b);
      else if (b > 0) owed += b;
    });

    return {
      success: true,
      youOwe: Math.round(owe * 100) / 100,
      owedToYou: Math.round(owed * 100) / 100,
      netBalance: Math.round((owed - owe) * 100) / 100,
    };
  }

  // Backup & Restore
  exportData() {
    return JSON.stringify({
      users: this.getCollection(STORAGE_KEYS.USERS),
      groups: this.getCollection(STORAGE_KEYS.GROUPS),
      expenses: this.getCollection(STORAGE_KEYS.EXPENSES),
      settlements: this.getCollection(STORAGE_KEYS.SETTLEMENTS),
      currentUser: this.getCurrentUser(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) this.setCollection(STORAGE_KEYS.USERS, data.users);
      if (data.groups) this.setCollection(STORAGE_KEYS.GROUPS, data.groups);
      if (data.expenses) this.setCollection(STORAGE_KEYS.EXPENSES, data.expenses);
      if (data.settlements) this.setCollection(STORAGE_KEYS.SETTLEMENTS, data.settlements);
      if (data.currentUser) this.setCurrentUser(data.currentUser);
      return { success: true };
    } catch {
      throw new Error('Invalid backup JSON format');
    }
  }

  resetData() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.SETTLEMENTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem('user');
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    this.ensureInitialized();
  }
}

export const frontendStore = new FrontendStore();
export default frontendStore;
