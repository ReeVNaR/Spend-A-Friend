import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Utensils,
  ShoppingBag,
  Car,
  ShoppingCart,
  Receipt,
  Film,
  Home,
  ChevronRight,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const categoryMap = {
  food: { icon: Utensils, bg: 'bg-amber-50', text: 'text-amber-500' },
  transport: { icon: Car, bg: 'bg-blue-50', text: 'text-blue-600' },
  shopping: { icon: ShoppingBag, bg: 'bg-rose-50', text: 'text-rose-500' },
  entertainment: { icon: Film, bg: 'bg-purple-50', text: 'text-purple-600' },
  utilities: { icon: ShoppingCart, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  accommodation: { icon: Home, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  other: { icon: Receipt, bg: 'bg-slate-50', text: 'text-slate-600' },
};

const formatActivityDate = (dateStr) => {
  if (!dateStr) return 'Recent';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getExpenseSubtitle = (expense, currentUserId) => {
  if (expense.group?.name) {
    return `with ${expense.group.name}`;
  }
  if (Array.isArray(expense.splits) && expense.splits.length > 0) {
    const otherParticipants = expense.splits
      .map((s) => s.user?.name || s.user)
      .filter((name) => name && typeof name === 'string' && !name.includes('You'));
    if (otherParticipants.length > 0) {
      return `with ${otherParticipants.slice(0, 2).join(', ')}`;
    }
  }
  return expense.paidBy?.name ? `paid by ${expense.paidBy.name}` : 'Shared Bill';
};

const RecentActivity = ({
  expenses = [],
  loading = false,
  currentUserId,
  onAddExpense,
}) => {
  const navigate = useNavigate();

  const displayItems = Array.isArray(expenses) ? expenses.slice(0, 6) : [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Recent Activity
        </h3>
        {displayItems.length > 0 && (
          <Link
            to="/activity"
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* White Activity Card */}
      <div className="bg-white rounded-3xl p-2 sm:p-3 border border-slate-100 shadow-sm divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">
            Loading recent transactions...
          </div>
        ) : displayItems.length > 0 ? (
          displayItems.map((item) => {
            const cat = categoryMap[item.category] || categoryMap.other;
            const CatIcon = cat.icon;
            const subtitle = item.subtitle || getExpenseSubtitle(item, currentUserId);
            const dateDisplay = item.dateText || formatActivityDate(item.date);
            const formattedAmt = formatCurrency(item.amount, item.currency || 'INR');

            return (
              <div
                key={item._id || item.id}
                onClick={() => navigate('/activity')}
                className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50/60 rounded-2xl transition-colors cursor-pointer group"
              >
                {/* Left: Icon & Title/Subtitle */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl ${cat.bg} ${cat.text} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <CatIcon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate tracking-tight">
                      {item.description}
                    </div>
                    <div className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {subtitle}
                    </div>
                  </div>
                </div>

                {/* Right: Date & Amount & Chevron */}
                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-medium leading-none">
                      {dateDisplay}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-1 leading-none">
                      {formattedAmt}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Receipt className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                No recent activity yet
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-xs mx-auto">
                Shared expenses and settlements will appear here as you add them.
              </p>
            </div>
            {onAddExpense && (
              <button
                type="button"
                onClick={onAddExpense}
                className="py-1.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs inline-flex items-center space-x-1 shadow-xs transition-all cursor-pointer mt-1"
              >
                <span>Add First Expense</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
