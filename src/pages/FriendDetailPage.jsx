import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../api/axios';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import Avatar from '../components/ui/Avatar';
import Loading from '../components/ui/Loading';
import ExpenseList from '../components/expenses/ExpenseList';
import SettlementList from '../components/settlements/SettlementList';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import SettleUpModal from '../components/settlements/SettleUpModal';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import { Plus, ArrowRightLeft, Receipt, Clock, ChevronLeft } from 'lucide-react';

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

  if (loading && !friend) {
    return <Loading fullScreen text="Loading friend..." />;
  }

  if (!friend) return null;

  const currentUserId = user?._id || user?.id;
  const numBalance = Number(balance) || 0;
  const isSettled = Math.abs(numBalance) < 0.01;
  const friendOwesYou = numBalance > 0.01;
  const youOweFriend = numBalance < -0.01;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/friends')}
        className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-blue-700 transition-colors font-semibold"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Friends</span>
      </button>

      {/* Friend Header Card */}
      <GlassCard className="p-6 sm:p-8 border-blue-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <Avatar name={friend.name} src={friend.avatar} size="lg" />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{friend.name}</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{friend.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <GlassButton
              variant="secondary"
              size="md"
              icon={ArrowRightLeft}
              onClick={() => setIsSettleUpOpen(true)}
            >
              Settle Up
            </GlassButton>
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

      {/* Prominent Net Balance Card in White & Blue */}
      <GlassCard
        className={`p-6 border-blue-100/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs ${
          friendOwesYou
            ? 'bg-sky-50/50 border-sky-200/90'
            : youOweFriend
            ? 'bg-blue-50/50 border-blue-200/90'
            : 'bg-white/80'
        }`}
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {isSettled
              ? 'Settled Up'
              : friendOwesYou
              ? `${friend.name} owes you`
              : `You owe ${friend.name}`}
          </span>
          <div
            className={`text-3xl sm:text-4xl font-extrabold mt-1 ${
              isSettled
                ? 'text-slate-500'
                : friendOwesYou
                ? 'text-sky-600'
                : 'text-blue-800'
            }`}
          >
            {formatCurrency(Math.abs(numBalance), user?.defaultCurrency || 'INR')}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium max-w-xs">
            {isSettled
              ? 'You both have settled all shared expenses and are completely square.'
              : friendOwesYou
              ? 'Your friend will need to pay you back to clear this balance.'
              : 'You can record a payment to settle this balance with your friend.'}
          </p>
        </div>
      </GlassCard>

      {/* Tab Navigation: Expenses vs Settlements */}
      <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-blue-50/70 border border-blue-100 max-w-xs shadow-inner">
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
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 ${
            activeTab === 'settlements'
              ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
              : 'text-slate-500 hover:text-blue-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Settlements</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' ? (
        <ExpenseList
          expenses={expenses}
          loading={loading}
          currentUserId={currentUserId}
          onDelete={handleDeleteExpense}
          onAddClick={() => setIsAddExpenseOpen(true)}
          emptyTitle={`No shared expenses with ${friend.name}`}
          emptyDescription="Add an expense to start splitting costs together."
        />
      ) : (
        <SettlementList
          settlements={settlements}
          loading={loading}
          currentUserId={currentUserId}
        />
      )}

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
        preselectedAmount={youOweFriend ? Math.abs(numBalance) : ''}
        friends={[friend]}
      />
    </div>
  );
};

export default FriendDetailPage;
