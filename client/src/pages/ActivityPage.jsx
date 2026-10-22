import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../api/axios';
import ExpenseList from '../components/expenses/ExpenseList';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { categoryIcons, categoryLabels } from '../utils/helpers';

const ActivityPage = () => {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, groupsRes] = await Promise.allSettled([
        api.get('/expenses'),
        api.get('/groups'),
      ]);

      if (expRes.status === 'fulfilled') {
        const list = expRes.value.data?.expenses || expRes.value.data || [];
        setExpenses(Array.isArray(list) ? list : []);
      }

      if (groupsRes.status === 'fulfilled') {
        const glist = groupsRes.value.data?.groups || groupsRes.value.data || [];
        setGroups(Array.isArray(glist) ? glist : []);
      }
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted');
      fetchActivity();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Group filter
      if (selectedGroup !== 'all') {
        const expGroupId = exp.group?._id || exp.group?.id || exp.group;
        if (expGroupId !== selectedGroup) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (exp.category !== selectedCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = exp.description?.toLowerCase().includes(q);
        const payerMatch = exp.paidBy?.name?.toLowerCase().includes(q);
        const notesMatch = exp.notes?.toLowerCase().includes(q);
        if (!descMatch && !payerMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [expenses, selectedGroup, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Activity History
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Complete log of all shared expenses, bills, and transactions.
        </p>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 sm:p-5 border-blue-100 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <GlassInput
            icon={Search}
            placeholder="Search description, payer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Group Filter */}
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              <option value="all" className="bg-white text-slate-800">
                All Groups & Individual
              </option>
              {groups.map((g) => (
                <option key={g._id || g.id} value={g._id || g.id} className="bg-white text-slate-800">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              <option value="all" className="bg-white text-slate-800">
                All Categories
              </option>
              {Object.keys(categoryIcons).map((cat) => (
                <option key={cat} value={cat} className="bg-white text-slate-800">
                  {categoryIcons[cat]} {categoryLabels[cat] || cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Expense List */}
      <ExpenseList
        expenses={filteredExpenses}
        loading={loading}
        currentUserId={user?._id || user?.id}
        onDelete={handleDeleteExpense}
        emptyTitle="No matching activity"
        emptyDescription="Try adjusting your search filters or group selection."
      />
    </div>
  );
};

export default ActivityPage;
