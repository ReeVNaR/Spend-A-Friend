import React from 'react';
import GlassCard from '../ui/GlassCard';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const BalanceSummary = ({
  youOwe = 0,
  owedToYou = 0,
  netBalance = 0,
  currency = 'INR',
  loading = false,
}) => {
  const isNetPositive = netBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. You Owe */}
      <GlassCard className="p-5 border-blue-200/80 bg-blue-50/40 hover:bg-blue-50/70 hover:border-blue-300 transition-all duration-300 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            You Owe
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-blue-800">
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            formatCurrency(Math.abs(youOwe), currency)
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">Total pending debt</p>
      </GlassCard>

      {/* 2. Owed to You */}
      <GlassCard className="p-5 border-sky-200/80 bg-sky-50/40 hover:bg-sky-50/70 hover:border-sky-300 transition-all duration-300 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
            Owed to You
          </span>
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-2xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-sky-600">
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            formatCurrency(Math.abs(owedToYou), currency)
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">Friends owe you</p>
      </GlassCard>

      {/* 3. Net Balance */}
      <GlassCard
        className="p-5 transition-all duration-300 shadow-xs border-blue-200/90 bg-white/90 hover:border-blue-400"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Total Net Balance
          </span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs bg-blue-600 text-white">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-blue-600">
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            `${isNetPositive && netBalance > 0 ? '+' : ''}${formatCurrency(
              netBalance,
              currency
            )}`
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">
          {isNetPositive
            ? netBalance === 0
              ? 'You are all settled up!'
              : 'Overall in the credit'
            : 'Overall you owe money'}
        </p>
      </GlassCard>
    </div>
  );
};

export default BalanceSummary;
