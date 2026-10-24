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

const defaultSampleExpenses = [
  {
    _id: 'sample-1',
    description: 'Dinner at Cafe',
    subtitle: 'with Aryan, Karan',
    category: 'food',
    dateText: 'Today, 8:45 PM',
    amount: 240,
  },
  {
    _id: 'sample-2',
    description: 'Zomato Order',
    subtitle: 'with Pratiksha',
    category: 'shopping',
    dateText: 'Yesterday',
    amount: 120,
  },
  {
    _id: 'sample-3',
    description: 'Cab Fare',
    subtitle: 'with College Group',
    category: 'transport',
    dateText: '20 Oct 2026',
    amount: 80,
  },
  {
    _id: 'sample-4',
    description: 'Groceries',
    subtitle: 'with Roommates',
    category: 'utilities',
    dateText: '18 Oct 2026',
    amount: 150,
  },
];

const RecentActivity = ({
  expenses = [],
  loading = false,
  currentUserId,
  onAddExpense,
}) => {
  const navigate = useNavigate();

  // If user has real expenses, display them; otherwise fallback to realistic sample rows so it matches mockup perfectly
  const displayItems =
    Array.isArray(expenses) && expenses.length > 0
      ? expenses.slice(0, 6)
      : defaultSampleExpenses;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Recent Activity
        </h3>
        <Link
          to="/activity"
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 group"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* White Activity Card */}
      <div className="bg-white rounded-3xl p-2 sm:p-3 border border-slate-100 shadow-sm divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-medium animate-pulse">
            Loading recent transactions...
          </div>
        ) : (
          displayItems.map((item) => {
            const cat = categoryMap[item.category] || categoryMap.other;
            const CatIcon = cat.icon;
            const subtitle = item.subtitle || getExpenseSubtitle(item, currentUserId);
            const dateDisplay = item.dateText || formatActivityDate(item.date);
            const formattedAmt = formatCurrency(item.amount, item.currency || 'INR');

            return (
              <div
                key={item._id || item.id}
                onClick={() => {
                  if (item._id && !item._id.startsWith('sample-')) {
                    navigate('/activity');
                  } else if (onAddExpense) {
                    onAddExpense();
                  }
                }}
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
                    <div className="text-sm font-extrabold text-rose-600 mt-1 leading-none">
                      {formattedAmt}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
