import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import {
  Search,
  Receipt,
  Utensils,
  Car,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Pencil,
  Filter,
  X,
} from 'lucide-react';

const categoryMap = {
  food: { label: 'Food', icon: Utensils, bg: 'bg-amber-50', text: 'text-amber-500' },
  transport: { label: 'Transport', icon: Car, bg: 'bg-blue-50', text: 'text-blue-600' },
  shopping: { label: 'Shopping', icon: ShoppingBag, bg: 'bg-rose-50', text: 'text-rose-500' },
  utilities: { label: 'Groceries', icon: ShoppingCart, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  other: { label: 'Other', icon: Receipt, bg: 'bg-slate-50', text: 'text-slate-600' },
};

const formatItemDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ActivityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Edit Expense modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, groupsRes] = await Promise.allSettled([
        api.get('/expenses?limit=150'),
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

  const currentUserId = user?._id || user?.id;

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

  // Initials for avatar
  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  const categoriesList = ['all', 'food', 'transport', 'shopping', 'utilities', 'other'];

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* 1. Page Title */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Activity History 📊
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Complete record of your shared expenses and transactions
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
          {filteredExpenses.length} total
        </span>
      </div>

      {/* 3. Search Bar & Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search activity, description, payer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills & Group selector */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Group dropdown pill */}
          {groups.length > 0 && (
            <div className="relative shrink-0">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="appearance-none pl-7 pr-7 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer focus:outline-hidden"
              >
                <option value="all">All Groups</option>
                {groups.map((g) => (
                  <option key={g._id || g.id} value={g._id || g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Category filter pills */}
          {categoriesList.map((catKey) => {
            const isSelected = selectedCategory === catKey;
            const catInfo = categoryMap[catKey];
            const label = catKey === 'all' ? 'All' : catInfo?.label || catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Activity List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 font-medium animate-pulse">
          Loading activity log...
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No activity found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {searchQuery || selectedGroup !== 'all' || selectedCategory !== 'all'
              ? 'Try adjusting your search query or filters to see more results.'
              : 'Add an expense to start tracking your activity.'}
          </p>
          {(searchQuery || selectedGroup !== 'all' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedGroup('all');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
            >
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredExpenses.map((expense) => {
            const payerId = expense.paidBy?._id || expense.paidBy;
            const payerName = expense.paidBy?.name || 'Someone';
            const isPayer = String(payerId) === String(currentUserId);
            const splits = expense.splits || [];
            const mySplit = splits.find(
              (s) => String(s.user?._id || s.user) === String(currentUserId)
            );

            let myStatus = 'Not involved';
            let myStatusColor = 'text-slate-400';
            if (isPayer) {
              const myShare = mySplit ? Number(mySplit.amount) : 0;
              const lent = Math.max(0, Number(expense.amount) - myShare);
              if (lent > 0) {
                myStatus = `You get back ${formatCurrency(lent, expense.currency || 'INR')}`;
                myStatusColor = 'text-emerald-600';
              } else {
                myStatus = 'You paid for yourself';
                myStatusColor = 'text-slate-500';
              }
            } else if (mySplit) {
              myStatus = `You owe ${formatCurrency(mySplit.amount, expense.currency || 'INR')}`;
              myStatusColor = 'text-rose-600';
            }

            const cat = categoryMap[expense.category] || categoryMap.other;
            const CatIcon = cat.icon;

            const canModify =
              isPayer ||
              String(expense.createdBy?._id || expense.createdBy) === String(currentUserId);

            return (
              <div
                key={expense._id || expense.id}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${cat.bg} ${cat.text}`}
                  >
                    <CatIcon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">
                      {expense.description}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5 flex items-center space-x-1.5">
                      <span>
                        Paid by <strong className="font-semibold text-slate-600">{isPayer ? 'You' : payerName}</strong>
                      </span>
                      <span>•</span>
                      <span>{formatItemDate(expense.date || expense.createdAt)}</span>
                      {expense.group && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 font-semibold truncate">
                            {expense.group.name || 'Group'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(expense.amount, expense.currency || 'INR')}
                    </div>
                    <div className={`text-[10px] font-bold ${myStatusColor}`}>
                      {myStatus}
                    </div>
                  </div>

                  {canModify && (
                    <div className="flex items-center space-x-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setExpenseToEdit(expense);
                          setIsAddExpenseOpen(true);
                        }}
                        className="p-1.5 text-slate-300 hover:text-blue-600 active:scale-90 transition-all"
                        title="Edit Expense"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(expense._id || expense.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 active:scale-90 transition-all"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        onSuccess={() => fetchActivity()}
        expenseToEdit={expenseToEdit}
        groups={groups}
      />
    </div>
  );
};

export default ActivityPage;
