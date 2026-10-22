import React from 'react';
import GlassButton from '../ui/GlassButton';
import { Plus, Users, ArrowRightLeft } from 'lucide-react';

const QuickActions = ({ onAddExpense, onCreateGroup, onSettleUp }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <GlassButton
        variant="primary"
        size="md"
        icon={Plus}
        onClick={onAddExpense}
        className="flex-1 sm:flex-initial"
      >
        Add Expense
      </GlassButton>

      <GlassButton
        variant="secondary"
        size="md"
        icon={Users}
        onClick={onCreateGroup}
        className="flex-1 sm:flex-initial"
      >
        Create Group
      </GlassButton>

      <GlassButton
        variant="secondary"
        size="md"
        icon={ArrowRightLeft}
        onClick={onSettleUp}
        className="flex-1 sm:flex-initial"
      >
        Settle Up
      </GlassButton>
    </div>
  );
};

export default QuickActions;
