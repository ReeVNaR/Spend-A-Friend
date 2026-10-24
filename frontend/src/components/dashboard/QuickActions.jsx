import React from 'react';
import { Plus, Users, ArrowRightLeft } from 'lucide-react';

const QuickActions = ({ onAddExpense, onCreateGroup, onSettleUp }) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
      {/* 1. Add Expense (Signature Electric Blue Action) */}
      <button
        type="button"
        onClick={onAddExpense}
        className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-3 sm:p-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Plus className="w-4 h-4 text-white stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
            Add Expense
          </div>
          <div className="text-[10px] text-blue-100 font-medium leading-tight mt-0.5 truncate hidden sm:block">
            Split bill
          </div>
        </div>
      </button>

      {/* 2. Create Group (Clean White Luxury Card) */}
      <button
        type="button"
        onClick={onCreateGroup}
        className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-3 sm:p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 text-slate-900 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Users className="w-4 h-4 text-slate-700 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight">
            New Group
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate hidden sm:block">
            Trip or home
          </div>
        </div>
      </button>

      {/* 3. Settle Up (Clean White Luxury Card) */}
      <button
        type="button"
        onClick={onSettleUp}
        className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-3 sm:p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 text-slate-900 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <ArrowRightLeft className="w-4 h-4 text-slate-700 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight">
            Settle Up
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate hidden sm:block">
            Record payment
          </div>
        </div>
      </button>
    </div>
  );
};

export default QuickActions;
