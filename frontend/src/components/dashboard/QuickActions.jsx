import React from 'react';
import { Plus, Users, ArrowRightLeft } from 'lucide-react';

const QuickActions = ({ onAddExpense, onCreateGroup, onSettleUp }) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {/* 1. Add Expense (Primary Blue Card) */}
      <button
        type="button"
        onClick={onAddExpense}
        className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-2.5 p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all hover:brightness-105 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4 text-white stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
            Add Expense
          </div>
          <div className="text-[10px] text-blue-100 font-medium leading-tight mt-0.5 truncate">
            Split with friends
          </div>
        </div>
      </button>

      {/* 2. Create Group (White Card) */}
      <button
        type="button"
        onClick={onCreateGroup}
        className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-2.5 p-2.5 sm:p-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 shadow-xs hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-blue-600 stroke-[2]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight">
            Create Group
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate">
            Start tracking
          </div>
        </div>
      </button>

      {/* 3. Settle Up (White Card) */}
      <button
        type="button"
        onClick={onSettleUp}
        className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-2.5 p-2.5 sm:p-3.5 rounded-2xl bg-white border border-slate-100 text-slate-900 shadow-xs hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <ArrowRightLeft className="w-4 h-4 text-blue-600 stroke-[2]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight">
            Settle Up
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate">
            Clear balances
          </div>
        </div>
      </button>
    </div>
  );
};

export default QuickActions;
