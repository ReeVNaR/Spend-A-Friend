import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../api/axios';
import Avatar from '../components/ui/Avatar';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import SettleUpModal from '../components/settlements/SettleUpModal';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  Plus,
  ArrowRightLeft,
  Receipt,
  Utensils,
  ShoppingBag,
  Car,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

const categoryMap = {
  food: { icon: Utensils, bg: 'bg-amber-50', text: 'text-amber-500' },
  transport: { icon: Car, bg: 'bg-blue-50', text: 'text-blue-600' },
  shopping: { icon: ShoppingBag, bg: 'bg-rose-50', text: 'text-rose-500' },
  utilities: { icon: ShoppingCart, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  other: { icon: Receipt, bg: 'bg-slate-50', text: 'text-slate-600' },
};

const formatItemDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const FriendDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [friend, setFriend] = useState(null);
  const [balance, setBalance] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);

  const fetchFriendData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/friends/${id}`);
      const data = res.data;

      if (data?.friend) {
        setFriend(data.friend);
        setBalance(data.balance ?? 0);
        if (Array.isArray(data.expenses)) setExpenses(data.expenses);
        if (Array.isArray(data.settlements)) setSettlements(data.settlements);
      } else {
        setFriend(data);
        setBalance(data.balance ?? 0);
      }

      if (!data?.expenses) {
        try {
          const expRes = await api.get(`/expenses?friend=${id}`);
          setExpenses(expRes.data?.expenses || expRes.data || []);
        } catch {
          // ignore
        }
      }

      if (!data?.settlements) {
        try {
          const setRes = await api.get(`/settlements?user=${id}`);
          setSettlements(setRes.data?.settlements || setRes.data || []);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Failed to load friend details:', err);
      toast.error('Could not load friend details');
      navigate('/friends');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchFriendData();
  }, [fetchFriendData]);

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted');
      fetchFriendData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const numBalance = Number(balance) || 0;
  const isSettled = Math.abs(numBalance) < 0.01;
  const friendOwesYou = numBalance > 0.01;
  const youOweFriend = numBalance < -0.01;

  if (loading && !friend) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 font-medium animate-pulse">
        Loading friend details...
      </div>
    );
  }

  if (!friend) return null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Top Bar with Back Button */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => navigate('/friends')}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Friends</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">1-on-1 Balance</span>
        </div>
      </div>

      {/* 2. Friend Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <Avatar name={friend.name} src={friend.avatar} size="lg" className="shadow-xs" />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              {friend.name}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{friend.email}</p>
          </div>
        </div>
      </div>

      {/* 3. Styled Balance Card (Matching Home Page Style) */}
      {isSettled ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center text-2xl">
            🤝
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              STATUS
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              All Settled Up!
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              You and {friend.name} are completely square.
            </p>
          </div>
        </div>
      ) : friendOwesYou ? (
        <div className="relative rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-white p-5 overflow-hidden shadow-xs">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3.5">
              <div className="w-13 h-13 rounded-2xl bg-emerald-100/75 flex items-center justify-center shrink-0 shadow-2xs">
                <span className="text-2xl">🫲</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                  OWES YOU
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
                  +{formatCurrency(numBalance, user?.defaultCurrency || 'INR')}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {friend.name} owes you money
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50/80 via-rose-50/40 to-white p-5 overflow-hidden shadow-xs">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3.5">
              <div className="w-13 h-13 rounded-2xl bg-rose-100/75 flex items-center justify-center shrink-0 shadow-2xs">
                <span className="text-2xl">🫴</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                  YOU OWE
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
                  -{formatCurrency(Math.abs(numBalance), user?.defaultCurrency || 'INR')}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  You owe {friend.name}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shadow-2xs shrink-0">
              <TrendingDown className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      )}

      {/* 4. Action Buttons (2-Column Row) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSettleUpOpen(true)}
          className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-white border border-slate-200/80 text-slate-900 font-bold text-xs sm:text-sm shadow-xs hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          <span>Settle Up</span>
        </button>
      </div>

      {/* 5. Pill Tabs (Expenses vs Settlements) */}
      <div className="flex p-1 rounded-2xl bg-slate-100 max-w-xs shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'expenses'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Expenses ({expenses.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'settlements'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Settlements ({settlements.length})</span>
        </button>
      </div>

      {/* 6. List Container */}
      <div className="bg-white rounded-3xl p-2 sm:p-3 border border-slate-100 shadow-sm divide-y divide-slate-100">
        {activeTab === 'expenses' ? (
          expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No shared expenses recorded with {friend.name} yet.
            </div>
          ) : (
            expenses.map((exp) => {
              const cat = categoryMap[exp.category] || categoryMap.other;
              const CatIcon = cat.icon;
              const isPaidByMe = String(exp.paidBy?._id || exp.paidBy) === String(user?._id || user?.id);

              return (
                <div
                  key={exp._id}
                  className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50/60 rounded-2xl transition-colors group"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl ${cat.bg} ${cat.text} flex items-center justify-center shrink-0 shadow-2xs`}>
                      <CatIcon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate tracking-tight">
                        {exp.description}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                        {isPaidByMe ? 'You paid' : `${friend.name} paid`} • {formatItemDate(exp.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 ml-2">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(exp.amount, exp.currency || 'INR')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp._id)}
                      className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          settlements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No settlements recorded yet.
            </div>
          ) : (
            settlements.map((set) => {
              const isFromMe = String(set.from?._id || set.from) === String(user?._id || user?.id);
              return (
                <div
                  key={set._id}
                  className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50/60 rounded-2xl transition-colors"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate tracking-tight">
                        {isFromMe ? `You paid ${friend.name}` : `${friend.name} paid you`}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        {formatItemDate(set.date)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600">
                      {formatCurrency(set.amount, set.currency || 'INR')}
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => fetchFriendData()}
        preselectedFriend={friend}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        onSuccess={() => fetchFriendData()}
        preselectedUser={friend}
        preselectedAmount={Math.abs(numBalance)}
      />
    </div>
  );
};

export default FriendDetailPage;
