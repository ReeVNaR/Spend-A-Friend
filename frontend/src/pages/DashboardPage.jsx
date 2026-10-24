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
  if (!name) return 'U';
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
    youOwe: 0,
    owedToYou: 0,
    netBalance: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);

  // Modal open states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Friend';

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
    <div className="space-y-5 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* 1. Welcome Greeting */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Hey, <span className="text-blue-600 font-black">{firstName}</span>! 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Here is your spending overview and balances.
        </p>
      </div>

      {/* 2. Quick Action Cards (3-Column Row) */}
      <QuickActions
        onAddExpense={() => setIsAddExpenseOpen(true)}
        onCreateGroup={() => setIsCreateGroupOpen(true)}
        onSettleUp={() => setIsSettleUpOpen(true)}
      />

      {/* 3. Balance Summary Cards (Net Balance Hero + Side-by-Side Owe/Owed) */}
      <BalanceSummary
        youOwe={balanceData.youOwe}
        owedToYou={balanceData.owedToYou}
        netBalance={balanceData.netBalance}
        currency={user?.defaultCurrency || 'INR'}
        loading={loading}
        onViewActivity={() => navigate('/activity')}
      />

      {/* 4. Recent Activity List */}
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
