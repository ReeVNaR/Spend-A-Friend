import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../api/axios';
import BalanceSummary from '../components/dashboard/BalanceSummary';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import SettleUpModal from '../components/settlements/SettleUpModal';

const getInitials = (name) => {
  if (!name) return 'RA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState({
    youOwe: 340,
    owedToYou: 0,
    netBalance: -340,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);

  // Modal open states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Ranveer';

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesRes, groupsRes, friendsRes, balRes] = await Promise.allSettled([
        api.get('/expenses?limit=10'),
        api.get('/groups'),
        api.get('/friends'),
        api.get('/friends/balances'),
      ]);

      const expensesList =
        expensesRes.status === 'fulfilled'
          ? expensesRes.value.data?.expenses || expensesRes.value.data || []
          : [];
      setRecentExpenses(Array.isArray(expensesList) ? expensesList : []);

      const groupsList =
        groupsRes.status === 'fulfilled'
          ? groupsRes.value.data?.groups || groupsRes.value.data || []
          : [];
      setGroups(Array.isArray(groupsList) ? groupsList : []);

      const friendsList =
        friendsRes.status === 'fulfilled'
          ? friendsRes.value.data?.friends || friendsRes.value.data || []
          : [];
      setFriends(Array.isArray(friendsList) ? friendsList : []);

      if (balRes.status === 'fulfilled' && balRes.value.data) {
        setBalanceData({
          youOwe: balRes.value.data.youOwe ?? 0,
          owedToYou: balRes.value.data.owedToYou ?? 0,
          netBalance: balRes.value.data.netBalance ?? 0,
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleExpenseSuccess = () => {
    fetchDashboardData();
  };

  const handleGroupSuccess = () => {
    fetchDashboardData();
  };

  const handleSettleSuccess = () => {
    fetchDashboardData();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Mobile Top Brand Bar (Matches Uploaded Screenshot) */}
      <div className="flex md:hidden items-center justify-between pt-1 pb-1">
        <div className="flex items-center space-x-2.5">
          {/* Spend-A-Friend Two-People Hugging Logo SVG */}
          <div className="w-11 h-11 shrink-0">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
              {/* Sparkles on top */}
              <path d="M12 7L13.5 10.5M8 11L11 13M19 8L17.5 11" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              {/* Left Friend Figure */}
              <circle cx="16" cy="18" r="4.5" fill="#2563eb" />
              <path d="M8 34C8 28 12 24.5 17 24.5C18.5 24.5 20 25 21 26" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
              <path d="M8 34C8 35 9 36 10 36H18" fill="#2563eb" />
              {/* Right Friend Figure */}
              <circle cx="32" cy="18" r="4.5" fill="#1d4ed8" />
              <path d="M40 34C40 28 36 24.5 31 24.5C29.5 24.5 28 25 27 26" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
              <path d="M40 34C40 35 39 36 38 36H30" fill="#1d4ed8" />
              {/* Torso Connection with Rupee Badge */}
              <path d="M11 36C11 28.5 16 26 24 26C32 26 37 28.5 37 36H11Z" fill="url(#brandGrad)" />
              <text x="24" y="33.5" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">₹</text>
              <defs>
                <linearGradient id="brandGrad" x1="11" y1="26" x2="37" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563eb" />
                  <stop offset="1" stopColor="#1e40af" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="text-[19px] font-black tracking-tight text-slate-900 leading-tight">
              Spend-A-<span className="text-blue-600">Friend</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium tracking-tight">
              Split Smart. Stay Close.
            </div>
          </div>
        </div>

        {/* User Initials Avatar Badge */}
        <Link
          to="/settings"
          className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-95 transition-transform"
          title="Account Settings"
        >
          {getInitials(user?.name)}
        </Link>
      </div>

      {/* 2. Welcome Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Hey, <span className="text-blue-600 font-black">{firstName}</span>! 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Here is your spending overview and group balances.
        </p>
      </div>

      {/* 3. Quick Action Cards (3-Column Row) */}
      <QuickActions
        onAddExpense={() => setIsAddExpenseOpen(true)}
        onCreateGroup={() => setIsCreateGroupOpen(true)}
        onSettleUp={() => setIsSettleUpOpen(true)}
      />

      {/* 4. Balance Summary Cards (You Owe, Owed to You, Total Net Balance) */}
      <BalanceSummary
        youOwe={balanceData.youOwe}
        owedToYou={balanceData.owedToYou}
        netBalance={balanceData.netBalance}
        currency={user?.defaultCurrency || 'INR'}
        loading={loading}
        onViewActivity={() => navigate('/activity')}
      />

      {/* 5. Recent Activity List */}
      <RecentActivity
        expenses={recentExpenses}
        loading={loading}
        currentUserId={user?._id || user?.id}
        onAddExpense={() => setIsAddExpenseOpen(true)}
      />

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={handleExpenseSuccess}
        groups={groups}
        friends={friends}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccess={handleGroupSuccess}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        onSuccess={handleSettleSuccess}
        friends={friends}
      />
    </div>
  );
};

export default DashboardPage;
