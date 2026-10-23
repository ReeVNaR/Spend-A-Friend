import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import Avatar from '../components/ui/Avatar';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import ExpenseList from '../components/expenses/ExpenseList';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import SettleUpModal from '../components/settlements/SettleUpModal';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import {
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
} from 'lucide-react';

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
    trip: { label: 'Trip', icon: Compass, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    home: { label: 'Home', icon: Home, color: 'text-sky-700 bg-sky-50 border-sky-200' },
    couple: { label: 'Couple', icon: Heart, color: 'text-blue-800 bg-blue-50 border-blue-200' },
    other: { label: 'General', icon: MoreHorizontal, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
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

  if (loading && !group) {
    return <Loading fullScreen text="Loading group details..." />;
  }

  if (!group) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Group Header Card */}
      <GlassCard className="p-6 sm:p-8 border-blue-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {group.name}
              </h1>

              <span
                className={`inline-flex items-center space-x-1.5 text-xs px-3 py-1 rounded-full border font-semibold ${currentType.color}`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                <span>{currentType.label}</span>
              </span>
            </div>

            {group.description && (
              <p className="text-sm text-slate-600 max-w-xl font-medium">
                {group.description}
              </p>
            )}

            {/* Invite code & Copy button */}
            <div className="flex items-center space-x-3 pt-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                <span className="text-slate-400 font-medium">Invite Code:</span>
                <span className="font-mono font-bold text-blue-700 tracking-wider">
                  {group.inviteCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInviteCode}
                  className="p-1 hover:text-blue-700 transition-colors"
                  title="Copy Invite Code"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center -space-x-2">
                {group.members?.slice(0, 5).map((m, idx) => {
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
              </div>
            </div>
          </div>

          {/* Action Button: Add Expense */}
          <div className="flex items-center space-x-3 shrink-0">
            <GlassButton
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setIsAddExpenseOpen(true)}
            >
              Add Expense
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Pill Tab Navigation */}
      <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-blue-50/70 border border-blue-100 max-w-md shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 ${
            activeTab === 'expenses'
              ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
              : 'text-slate-500 hover:text-blue-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('balances')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 ${
            activeTab === 'balances'
              ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
              : 'text-slate-500 hover:text-blue-700'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Balances</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 ${
            activeTab === 'members'
              ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
              : 'text-slate-500 hover:text-blue-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members</span>
        </button>
      </div>

      {/* Tab 1: Expenses List */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <ExpenseList
            expenses={expenses}
            loading={loading}
            currentUserId={currentUserId}
            onDelete={handleDeleteExpense}
            onAddClick={() => setIsAddExpenseOpen(true)}
            emptyTitle="No group expenses yet"
            emptyDescription="Add bills, dinners, or trip tickets to automatically split between group members."
          />
        </div>
      )}

      {/* Tab 2: Balances & Simplified Debts */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          {simplifiedDebts.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="All settled up!"
              description="There are currently no outstanding debts in this group. Everyone is even!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simplifiedDebts.map((debt, idx) => {
                const debtor = resolveUser(debt.from);
                const creditor = resolveUser(debt.to);
                const isDebtorMe = String(debtor._id || debtor.id) === String(currentUserId);
                const isCreditorMe = String(creditor._id || creditor.id) === String(currentUserId);

                return (
                  <GlassCard
                    key={idx}
                    className="p-5 flex flex-col justify-between space-y-4 border-blue-100/80 shadow-xs"
                  >
                    {/* Visual Debt representation */}
                    <div className="flex items-center justify-between">
                      {/* From User (Debtor) */}
                      <div className="flex items-center space-x-2.5">
                        <Avatar name={debtor.name} src={debtor.avatar} size="md" />
                        <div>
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {isDebtorMe ? 'You' : debtor.name}
                          </div>
                          <span className="text-[10px] text-blue-800 uppercase tracking-wider font-bold">
                            owes
                          </span>
                        </div>
                      </div>

                      {/* Direction Arrow & Amount */}
                      <div className="flex flex-col items-center px-2">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900">
                          {formatCurrency(debt.amount, group.currency || 'INR')}
                        </span>
                        <ArrowRight className="w-5 h-5 text-blue-600 animate-pulse mt-0.5" />
                      </div>

                      {/* To User (Creditor) */}
                      <div className="flex items-center space-x-2.5 text-right">
                        <div>
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {isCreditorMe ? 'You' : creditor.name}
                          </div>
                          <span className="text-[10px] text-sky-600 uppercase tracking-wider font-bold">
                            gets
                          </span>
                        </div>
                        <Avatar name={creditor.name} src={creditor.avatar} size="md" />
                      </div>
                    </div>

                    {/* Settle button */}
                    <div className="flex justify-end pt-2 border-t border-blue-50">
                      <GlassButton
                        variant={isDebtorMe ? 'primary' : 'secondary'}
                        size="sm"
                        icon={ArrowRightLeft}
                        onClick={() => {
                          setSettleDebtTarget({
                            user: creditor,
                            amount: debt.amount,
                          });
                          setIsSettleUpOpen(true);
                        }}
                      >
                        {isDebtorMe ? 'Pay Now' : 'Record Settlement'}
                      </GlassButton>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Group Members */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          {group.members?.map((memberObj, idx) => {
            const memberUser = memberObj.user || memberObj;
            const uid = String(memberUser._id || memberUser.id || memberUser);
            const isMe = uid === String(currentUserId);
            const net = Number(netBalances[uid] || 0);
            const isSettled = Math.abs(net) < 0.01;
            const isOwed = net > 0.01;

            return (
              <GlassCard
                key={uid || idx}
                className="p-4 sm:p-5 flex items-center justify-between border-blue-100/80 shadow-xs"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <Avatar
                    name={memberUser.name || 'Member'}
                    src={memberUser.avatar}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {memberUser.name || 'Group Member'} {isMe && '(You)'}
                      </span>
                      {memberObj.role === 'admin' && (
                        <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>
                    {memberUser.email && (
                      <p className="text-xs text-slate-500 truncate font-medium">
                        {memberUser.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Net balance in group */}
                <div className="text-right shrink-0">
                  {isSettled ? (
                    <span className="text-xs text-slate-400 font-semibold">Settled</span>
                  ) : isOwed ? (
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">gets back</div>
                      <div className="text-sm sm:text-base font-extrabold text-sky-600">
                        +{formatCurrency(net, group.currency || 'INR')}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">owes</div>
                      <div className="text-sm sm:text-base font-extrabold text-blue-800">
                        -{formatCurrency(Math.abs(net), group.currency || 'INR')}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
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
