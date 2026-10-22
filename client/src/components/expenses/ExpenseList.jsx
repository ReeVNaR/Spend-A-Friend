import React from 'react';
import ExpenseCard from './ExpenseCard';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import { Receipt } from 'lucide-react';

const ExpenseList = ({
  expenses = [],
  loading = false,
  currentUserId,
  onDelete,
  emptyTitle = 'No expenses yet',
  emptyDescription = 'Expenses added to this group or with friends will show up here.',
  onAddClick,
}) => {
  if (loading && (!expenses || expenses.length === 0)) {
    return <Loading text="Loading expenses..." />;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={emptyTitle}
        description={emptyDescription}
        action={
          onAddClick
            ? {
                label: 'Add First Expense',
                onClick: onAddClick,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense._id || expense.id}
          expense={expense}
          currentUserId={currentUserId}
          onDelete={onDelete}
        />
      ))}
      {loading && (
        <div className="py-4">
          <Loading text="Updating expenses..." />
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
