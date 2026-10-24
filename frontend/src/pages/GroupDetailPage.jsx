import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Copy,
  Plus,
  ArrowRight,
  ArrowRightLeft,
  Users,
  Compass,
  Home,
  Heart,
  MoreHorizontal,
  Scale,
  Receipt,
  ShieldCheck,
  Check,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Trash2,
  Utensils,
  Car,
  ShoppingBag,
  ShoppingCart,
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

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({
    netBalances: {},
    simplifiedDebts: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settleDebtTarget, setSettleDebtTarget] = useState(null);

  const fetchGroupData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupRes, expensesRes, balancesRes] = await Promise.allSettled([
        api.get(`/groups/${id}`),
        api.get(`/expenses?group=${id}`),
        api.get(`/groups/${id}/balances`),
      ]);

      if (groupRes.status === 'fulfilled') {
        setGroup(groupRes.value.data?.group || groupRes.value.data);
      } else {
        toast.error('Could not find group');
        navigate('/groups');
        return;
      }

      if (expensesRes.status === 'fulfilled') {
        const expList =
          expensesRes.value.data?.expenses || expensesRes.value.data || [];
        setExpenses(Array.isArray(expList) ? expList : []);
      }

      if (balancesRes.status === 'fulfilled') {
        const balData = balancesRes.value.data?.balances || balancesRes.value.data || {};
        setBalances({
          netBalances: balData.netBalances || {},
          simplifiedDebts: balData.simplifiedDebts || [],
        });
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleCopyInviteCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    toast.success('Invite code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted');
      fetchGroupData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const typeConfig = {
    trip: { label: 'Trip', icon: Compass, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    home: { label: 'Home', icon: Home, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    couple: { label: 'Couple', icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    other: { label: 'General', icon: MoreHorizontal, color: 'text-slate-600 bg-slate-50 border-slate-100' },
  };

  const currentType = typeConfig[group?.type] || typeConfig.other;
  const TypeIcon = currentType.icon;

  const currentUserId = user?._id || user?.id;
  const { simplifiedDebts = [], netBalances = {} } = balances;

  const resolveUser = (userIdOrObj) => {
    if (!userIdOrObj) return { name: 'User' };
    if (typeof userIdOrObj === 'object' && userIdOrObj.name) return userIdOrObj;
    const foundMember = group?.members?.find(
      (m) => String(m.user?._id || m.user?.id || m.user) === String(userIdOrObj)
    );
    if (foundMember && foundMember.user) return foundMember.user;
    if (String(userIdOrObj) === String(currentUserId)) return user;
    return { name: 'User' };
  };

  // User's personal balance in this group
  const myNetBalance = Number(netBalances[String(currentUserId)] || 0);
  const isSettled = Math.abs(myNetBalance) < 0.01;
  const youAreOwed = myNetBalance > 0.01;
  const youOwe = myNetBalance < -0.01;

  // Group total spend
  const totalGroupSpend = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [expenses]);

  if (loading && !group) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 font-medium animate-pulse">
        Loading group details...
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Top Bar with Back Button & Invite Code */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Groups</span>
        </button>

        <div className="flex items-center space-x-2">
          {group.inviteCode && (
            <button
              type="button"
              onClick={handleCopyInviteCode}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
            >
              <span className="text-slate-400 font-normal">Code:</span>
              <span className="font-mono font-bold text-blue-600">{group.inviteCode}</span>
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          )}

          <span
            className={`inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-xl border font-semibold ${currentType.color}`}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            <span>{currentType.label}</span>
          </span>
        </div>
      </div>

      {/* 2. Group Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {group.description}
              </p>
            )}
          </div>

          <div className="flex items-center -space-x-2 shrink-0">
            {group.members?.slice(0, 4).map((m, idx) => {
              const memberUser = m.user || m;
              return (
                <Avatar
                  key={memberUser._id || idx}
                  name={memberUser.name || 'Member'}
                  src={memberUser.avatar}
                  size="sm"
                  className="ring-2 ring-white shadow-2xs"
                />
              );
            })}
            {group.members?.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-2xs">
                +{group.members.length - 4}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
          <div className="text-slate-400 font-medium">
            <span>{group.members?.length || 0} members</span>
            <span className="mx-1.5">•</span>
            <span>{expenses.length} expenses</span>
          </div>

          <div className="text-slate-600 font-medium">
            Total Spend:{' '}
            <strong className="text-slate-900 font-bold">
              {formatCurrency(totalGroupSpend, group.currency || 'INR')}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. User Balance in Group Card */}
      <div
        className={`rounded-3xl p-5 border shadow-sm relative overflow-hidden transition-all ${
          isSettled
            ? 'bg-white border-slate-100'
            : youAreOwed
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
              ) : youAreOwed ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">You Are Owed In Group</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-rose-700">You Owe In Group</span>
                </>
              )}
            </div>

            <div
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isSettled
                  ? 'text-slate-700'
                  : youAreOwed
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {isSettled
                ? formatCurrency(0, group.currency || 'INR')
                : youAreOwed
                ? `+${formatCurrency(myNetBalance, group.currency || 'INR')}`
                : `-${formatCurrency(Math.abs(myNetBalance), group.currency || 'INR')}`}
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              {isSettled
                ? 'You have no pending balance in this group'
                : youAreOwed
                ? 'Group members owe you a total of this amount'
                : 'You need to settle this amount with group members'}
            </p>
          </div>

          {/* Soundwave/Bar chart visual decoration */}
          <div className="flex items-end space-x-1 h-10 opacity-30 shrink-0">
            <span
              className={`w-1 rounded-full ${
                youAreOwed ? 'bg-emerald-500' : youOwe ? 'bg-rose-500' : 'bg-slate-400'
              } h-4`}
            />
            <span
              className={`w-1 rounded-full ${
                youAreOwed ? 'bg-emerald-500' : youOwe ? 'bg-rose-500' : 'bg-slate-400'
              } h-7`}
            />
            <span
              className={`w-1 rounded-full ${
                youAreOwed ? 'bg-emerald-500' : youOwe ? 'bg-rose-500' : 'bg-slate-400'
              } h-10`}
            />
            <span
              className={`w-1 rounded-full ${
                youAreOwed ? 'bg-emerald-500' : youOwe ? 'bg-rose-500' : 'bg-slate-400'
              } h-6`}
            />
            <span
              className={`w-1 rounded-full ${
                youAreOwed ? 'bg-emerald-500' : youOwe ? 'bg-rose-500' : 'bg-slate-400'
              } h-3`}
            />
          </div>
        </div>
      </div>

      {/* 4. Action Buttons (Add Expense & Settle Up) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setIsAddExpenseOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl py-3 px-4 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSettleDebtTarget(null);
            setIsSettleUpOpen(true);
          }}
          className="bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 rounded-2xl py-3 px-4 font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2"
        >
          <ArrowRightLeft className="w-4 h-4 stroke-[2.5] text-slate-600" />
          <span>Settle Up</span>
        </button>
      </div>

      {/* 5. Pill Tab Switcher */}
      <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/50">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'expenses'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Expenses</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
            {expenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('balances')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'balances'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Balances</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
            {simplifiedDebts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'members'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
            {group.members?.length || 0}
          </span>
        </button>
      </div>

      {/* 6. Tab Content */}

      {/* Tab 1: Expenses */}
      {activeTab === 'expenses' && (
        <div>
          {expenses.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No expenses in this group yet</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Add shared bills, food receipts, or ride tickets to split easily among members.
              </p>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Expense</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {expenses.map((expense) => {
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

                const canDelete =
                  isPayer ||
                  String(expense.createdBy?._id || expense.createdBy) === String(currentUserId) ||
                  group.createdBy === currentUserId ||
                  group.members?.some(
                    (m) => String(m.user?._id || m.user) === String(currentUserId) && m.role === 'admin'
                  );

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
                        <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                          Paid by <span className="font-semibold text-slate-600">{isPayer ? 'You' : payerName}</span> • {formatItemDate(expense.date || expense.createdAt)}
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

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense._id || expense.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Balances & Simplified Debts */}
      {activeTab === 'balances' && (
        <div className="space-y-3">
          {simplifiedDebts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">All settled up!</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                There are no pending debts in this group. Everyone is completely squared up.
              </p>
            </div>
          ) : (
            simplifiedDebts.map((debt, idx) => {
              const debtor = resolveUser(debt.from);
              const creditor = resolveUser(debt.to);
              const isDebtorMe = String(debtor._id || debtor.id) === String(currentUserId);
              const isCreditorMe = String(creditor._id || creditor.id) === String(currentUserId);

              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    {/* Debtor */}
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Avatar name={debtor.name} src={debtor.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {isDebtorMe ? 'You' : debtor.name}
                        </div>
                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">
                          owes
                        </span>
                      </div>
                    </div>

                    {/* Amount & Arrow */}
                    <div className="flex flex-col items-center px-3">
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        {formatCurrency(debt.amount, group.currency || 'INR')}
                      </span>
                      <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5" />
                    </div>

                    {/* Creditor */}
                    <div className="flex items-center space-x-2.5 text-right min-w-0">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {isCreditorMe ? 'You' : creditor.name}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                          gets
                        </span>
                      </div>
                      <Avatar name={creditor.name} src={creditor.avatar} size="sm" />
                    </div>
                  </div>

                  {/* Settle button */}
                  {(isDebtorMe || isCreditorMe) && (
                    <div className="pt-2 border-t border-slate-50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSettleDebtTarget({
                            user: isDebtorMe ? creditor : debtor,
                            amount: debt.amount,
                          });
                          setIsSettleUpOpen(true);
                        }}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isDebtorMe
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>{isDebtorMe ? 'Pay Now' : 'Record Settlement'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Group Members */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {group.members?.map((memberObj, idx) => {
            const memberUser = memberObj.user || memberObj;
            const uid = String(memberUser._id || memberUser.id || memberUser);
            const isMe = uid === String(currentUserId);
            const net = Number(netBalances[uid] || 0);
            const isMemberSettled = Math.abs(net) < 0.01;
            const isMemberOwed = net > 0.01;

            return (
              <div
                key={uid || idx}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar
                    name={memberUser.name || 'Member'}
                    src={memberUser.avatar}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {memberUser.name || 'Group Member'} {isMe && '(You)'}
                      </span>
                      {memberObj.role === 'admin' && (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>
                    {memberUser.email && (
                      <p className="text-[11px] text-slate-400 truncate font-medium">
                        {memberUser.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isMemberSettled ? (
                    <span className="text-xs text-slate-400 font-semibold">Settled</span>
                  ) : isMemberOwed ? (
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">gets back</div>
                      <div className="text-xs sm:text-sm font-black text-emerald-600">
                        +{formatCurrency(net, group.currency || 'INR')}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">owes</div>
                      <div className="text-xs sm:text-sm font-black text-rose-600">
                        -{formatCurrency(Math.abs(net), group.currency || 'INR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={() => fetchGroupData()}
        preselectedGroup={group}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => {
          setIsSettleUpOpen(false);
          setSettleDebtTarget(null);
        }}
        onSuccess={() => fetchGroupData()}
        preselectedUser={settleDebtTarget?.user}
        preselectedAmount={settleDebtTarget?.amount}
        groupId={group._id || group.id}
        groupMembers={group.members?.map((m) => m.user || m)}
      />
    </div>
  );
};

export default GroupDetailPage;
