import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Pencil,
  MoreVertical,
  UserX,
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);

  // Outside click for menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showMenu]);

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

  const handleDeleteSettlement = async (settlementId) => {
    if (!window.confirm('Are you sure you want to delete this recorded settlement?')) return;
    try {
      await api.delete(`/settlements/${settlementId}`);
      toast.success('Settlement deleted');
      fetchFriendData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete settlement');
    }
  };

  const numBalance = Number(balance) || 0;
  const isSettled = Math.abs(numBalance) < 0.01;
  const friendOwesYou = numBalance > 0.01;
  const youOweFriend = numBalance < -0.01;

  const handleRemoveFriend = async () => {
    if (Math.abs(numBalance) > 0.01) {
      const proceed = window.confirm(
        `You have an unsettled balance of ${formatCurrency(Math.abs(numBalance), 'INR')} with ${friend.name}. Are you sure you want to remove them from your friends list?`
      );
      if (!proceed) return;
    } else if (!window.confirm(`Are you sure you want to remove ${friend.name} from your friends list?`)) {
      return;
    }

    try {
      await api.delete(`/friends/${id}`);
      toast.success('Friend removed');
      navigate('/friends');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove friend');
    }
  };

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
      {/* 1. Top Bar with Back Button and Friend Options */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => navigate('/friends')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Friends</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">
            {expenses.length} expenses
          </span>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
              title="Friend Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border border-slate-100 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    handleRemoveFriend();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50/60 flex items-center space-x-2"
                >
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Remove Friend</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Friend Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
        <Avatar name={friend.name} src={friend.avatar} size="lg" className="ring-2 ring-slate-100" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black text-slate-900 truncate tracking-tight">
            {friend.name}
          </h1>
          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
            {friend.email}
          </p>
        </div>
      </div>

      {/* 3. Balance Card with Waveform Decor */}
      <div
        className={`rounded-3xl p-5 border shadow-sm relative overflow-hidden transition-all ${
          isSettled
            ? 'bg-white border-slate-100'
            : friendOwesYou
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border-emerald-100'
            : 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white border-rose-100'
        }`}
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider">
              {isSettled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-slate-500">All Settled Up</span>
                </>
              ) : friendOwesYou ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{friend.name} Owes You</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-rose-700">You Owe {friend.name}</span>
                </>
              )}
            </div>

            <div
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isSettled
                  ? 'text-slate-700'
                  : friendOwesYou
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {isSettled
                ? formatCurrency(0, 'INR')
                : friendOwesYou
                ? `+${formatCurrency(numBalance, 'INR')}`
                : `-${formatCurrency(Math.abs(numBalance), 'INR')}`}
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              {isSettled
                ? 'You and this friend are completely even'
                : friendOwesYou
                ? `${friend.name} has pending debts to settle with you`
                : `You have pending debts to settle with ${friend.name}`}
            </p>
          </div>

          {/* Soundwave/Bar chart visual decoration */}
          <div className="flex items-end space-x-1 h-10 opacity-30 shrink-0">
            <span
              className={`w-1 rounded-full ${
                friendOwesYou ? 'bg-emerald-500' : youOweFriend ? 'bg-rose-500' : 'bg-slate-400'
              } h-4`}
            />
            <span
              className={`w-1 rounded-full ${
                friendOwesYou ? 'bg-emerald-500' : youOweFriend ? 'bg-rose-500' : 'bg-slate-400'
              } h-7`}
            />
            <span
              className={`w-1 rounded-full ${
                friendOwesYou ? 'bg-emerald-500' : youOweFriend ? 'bg-rose-500' : 'bg-slate-400'
              } h-10`}
            />
            <span
              className={`w-1 rounded-full ${
                friendOwesYou ? 'bg-emerald-500' : youOweFriend ? 'bg-rose-500' : 'bg-slate-400'
              } h-6`}
            />
            <span
              className={`w-1 rounded-full ${
                friendOwesYou ? 'bg-emerald-500' : youOweFriend ? 'bg-rose-500' : 'bg-slate-400'
              } h-3`}
            />
          </div>
        </div>
      </div>

      {/* 4. Action Buttons (Add Expense & Settle Up) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setExpenseToEdit(null);
            setIsAddExpenseOpen(true);
          }}
          className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSettleUpOpen(true)}
          className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-white border border-slate-200/80 text-slate-900 font-bold text-xs sm:text-sm shadow-xs hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowRightLeft className="w-4 h-4 text-blue-600 stroke-[2.5]" />
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
              const isCreator = String(exp.createdBy?._id || exp.createdBy) === String(user?._id || user?.id);
              const canModify = isPaidByMe || isCreator;

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

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(exp.amount, exp.currency || 'INR')}
                      </div>
                    </div>

                    {canModify && (
                      <div className="flex items-center space-x-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setExpenseToEdit(exp);
                            setIsAddExpenseOpen(true);
                          }}
                          className="p-1.5 text-slate-300 hover:text-blue-600 active:scale-90 transition-all cursor-pointer"
                          title="Edit expense"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp._id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 active:scale-90 transition-all cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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
              const currentUid = String(user?._id || user?.id);
              const isFromMe = String(set.from?._id || set.from) === currentUid;
              const isCreatedByMe = String(set.createdBy?._id || set.createdBy) === currentUid || isFromMe;

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

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-600">
                        {formatCurrency(set.amount, set.currency || 'INR')}
                      </div>
                    </div>

                    {isCreatedByMe && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSettlement(set._id)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 active:scale-90 transition-all cursor-pointer"
                        title="Delete settlement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        onSuccess={() => fetchFriendData()}
        preselectedFriend={friend}
        expenseToEdit={expenseToEdit}
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
