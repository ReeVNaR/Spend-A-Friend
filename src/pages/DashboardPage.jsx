import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../api/axios';
import BalanceSummary from '../components/dashboard/BalanceSummary';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import SettleUpModal from '../components/settlements/SettleUpModal';

const DashboardPage = () => {
  const { user } = useAuth();

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

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch expenses, groups, and friends concurrently
      const [expensesRes, groupsRes, friendsRes] = await Promise.allSettled([
        api.get('/expenses?limit=10'),
        api.get('/groups'),
        api.get('/friends'),
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

      // Calculate balances from friends or direct balance endpoint
      try {
        const balRes = await api.get('/friends/balances');
        if (balRes.data) {
          setBalanceData({
            youOwe: balRes.data.youOwe || 0,
            owedToYou: balRes.data.owedToYou || 0,
            netBalance: balRes.data.netBalance || 0,
          });
        }
      } catch {
        // Fallback: calculate from friends list if friends endpoint provided balances
        let owe = 0;
        let owed = 0;
        if (Array.isArray(friendsList)) {
          friendsList.forEach((f) => {
            const b = Number(f.balance || 0);
            if (b < 0) owe += Math.abs(b);
            else if (b > 0) owed += b;
          });
        }
        setBalanceData({
          youOwe: owe,
          owedToYou: owed,
          netBalance: owed - owe,
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Quick Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hey, <span className="gradient-text">{user?.name || 'Friend'}</span>! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Here is your spending overview and group balances.
          </p>
        </div>

        <QuickActions
          onAddExpense={() => setIsAddExpenseOpen(true)}
          onCreateGroup={() => setIsCreateGroupOpen(true)}
          onSettleUp={() => setIsSettleUpOpen(true)}
        />
      </div>

      {/* Balance Summary Cards */}
      <BalanceSummary
        youOwe={balanceData.youOwe}
        owedToYou={balanceData.owedToYou}
        netBalance={balanceData.netBalance}
        currency={user?.defaultCurrency || 'INR'}
        loading={loading}
      />

      {/* Recent Activity List */}
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
