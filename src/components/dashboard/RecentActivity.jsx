import React from 'react';
import { Link } from 'react-router-dom';
import ExpenseCard from '../expenses/ExpenseCard';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import { ArrowRight, Clock } from 'lucide-react';

const RecentActivity = ({
  expenses = [],
  loading = false,
  currentUserId,
  onAddExpense,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Recent Activity
        </h3>
        <Link
          to="/activity"
          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <Loading text="Loading activity..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No recent activity"
          description="When you add expenses or split bills with friends, they will show up here."
          action={
            onAddExpense
              ? {
                  label: 'Add Expense',
                  onClick: onAddExpense,
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {expenses.slice(0, 6).map((expense) => (
            <ExpenseCard
              key={expense._id || expense.id}
              expense={expense}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
