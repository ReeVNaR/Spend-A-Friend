import React from 'react';
import { TrendingDown, TrendingUp, Wallet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const BalanceSummary = ({
  youOwe = 0,
  owedToYou = 0,
  netBalance = 0,
  currency = 'INR',
  loading = false,
  onViewActivity,
}) => {
  const isNetPositive = netBalance > 0;
  const isNetZero = netBalance === 0;

  return (
    <div className="space-y-3">
      {/* 1. Hero Total Net Balance Card (Pure White Luxury) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_2px_14px_-2px_rgba(15,23,42,0.04)] hover:shadow-[0_6px_24px_-4px_rgba(15,23,42,0.07)] transition-all">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] tracking-wider uppercase border border-blue-100/80">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Total Net Balance</span>
            </span>

            <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 pt-1">
              {loading ? (
                <span className="animate-pulse text-slate-300">...</span>
              ) : (
                <span
                  className={
                    isNetZero
                      ? 'text-slate-900'
                      : isNetPositive
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }
                >
                  {isNetPositive ? '+' : isNetZero ? '' : '-'}
                  {formatCurrency(Math.abs(netBalance), currency)}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {loading
                ? 'Calculating balances...'
                : isNetZero
                ? 'All settled up! No outstanding balances.'
                : isNetPositive
                ? 'You are owed money overall.'
                : 'You owe money overall.'}
            </p>
          </div>

          {/* Quick Action to View Activity */}
          <button
            type="button"
            onClick={onViewActivity}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-all shrink-0 cursor-pointer group"
            title="View Activity Details"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 2. Side-by-Side Balance Metrics: You Owe & Owed to You */}
      <div className="grid grid-cols-2 gap-3">
        {/* You Owe Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-bold text-[10px] tracking-wider uppercase border border-rose-100/60">
              You Owe
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-3.5 h-3.5 stroke-[2.4]" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {loading ? (
                <span className="animate-pulse text-slate-300">...</span>
              ) : (
                formatCurrency(Math.abs(youOwe), currency)
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
              To friends &amp; groups
            </p>
          </div>
        </div>

        {/* Owed to You Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_20px_-3px_rgba(15,23,42,0.06)] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-bold text-[10px] tracking-wider uppercase border border-emerald-100/60">
              Owed to You
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.4]" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {loading ? (
                <span className="animate-pulse text-slate-300">...</span>
              ) : (
                formatCurrency(Math.abs(owedToYou), currency)
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
              From friends &amp; groups
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSummary;
