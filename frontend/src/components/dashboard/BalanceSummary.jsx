import React from 'react';
import { TrendingDown, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const BalanceSummary = ({
  youOwe = 0,
  owedToYou = 0,
  netBalance = 0,
  currency = 'INR',
  loading = false,
  onViewActivity,
}) => {
  const isNetPositive = netBalance >= 0;

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* 1. YOU OWE CARD */}
      <div className="relative rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50/80 via-rose-50/40 to-white p-5 overflow-hidden shadow-xs hover:shadow-md transition-all">
        {/* Decorative Waveform Bars */}
        <div className="absolute right-4 bottom-2.5 flex items-end gap-1.5 opacity-35 pointer-events-none select-none">
          <div className="w-2 h-3.5 rounded-full bg-rose-400" />
          <div className="w-2 h-6 rounded-full bg-rose-400" />
          <div className="w-2 h-10 rounded-full bg-rose-400" />
          <div className="w-2 h-12 rounded-full bg-rose-400" />
          <div className="w-2 h-7 rounded-full bg-rose-400" />
          <div className="w-2 h-11 rounded-full bg-rose-400" />
          <div className="w-2 h-5 rounded-full bg-rose-400" />
          <div className="w-2 h-8 rounded-full bg-rose-400" />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-3.5">
            {/* Peach Hand Holding Cash Badge */}
            <div className="w-13 h-13 rounded-2xl bg-rose-100/75 flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                <rect x="14" y="6" width="14" height="8" rx="2" fill="#10b981" />
                <circle cx="21" cy="10" r="1.5" fill="#ffffff" />
                <path d="M4 22C7 22 10 20 13 22L20 20C21.5 19.5 23 21 22 22.5L17 26C15 27 12 27 9 26L4 24V22Z" fill="#fb7185" />
                <path d="M12 21L19 18C20.5 17.5 22 19 21 20.5L16 24C14.5 25 12 25 10 24L5 22.5V21H12Z" fill="#fda4af" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                YOU OWE
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {loading ? (
                  <span className="animate-pulse text-slate-400">...</span>
                ) : (
                  formatCurrency(Math.abs(youOwe), currency)
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Total pending debt
              </p>
            </div>
          </div>

          {/* Trending Down Badge */}
          <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shadow-2xs shrink-0">
            <TrendingDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 2. OWED TO YOU CARD */}
      <div className="relative rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-white p-5 overflow-hidden shadow-xs hover:shadow-md transition-all">
        {/* Decorative Waveform Bars */}
        <div className="absolute right-4 bottom-2.5 flex items-end gap-1.5 opacity-35 pointer-events-none select-none">
          <div className="w-2 h-4 rounded-full bg-emerald-400" />
          <div className="w-2 h-7 rounded-full bg-emerald-400" />
          <div className="w-2 h-11 rounded-full bg-emerald-400" />
          <div className="w-2 h-13 rounded-full bg-emerald-400" />
          <div className="w-2 h-8 rounded-full bg-emerald-400" />
          <div className="w-2 h-10 rounded-full bg-emerald-400" />
          <div className="w-2 h-5 rounded-full bg-emerald-400" />
          <div className="w-2 h-7 rounded-full bg-emerald-400" />
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-3.5">
            {/* Mint Hand Receiving Cash Badge */}
            <div className="w-13 h-13 rounded-2xl bg-emerald-100/75 flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                <rect x="6" y="8" width="14" height="8" rx="2" fill="#10b981" />
                <circle cx="13" cy="12" r="1.5" fill="#ffffff" />
                <path d="M28 22C25 22 22 20 19 22L12 20C10.5 19.5 9 21 10 22.5L15 26C17 27 20 27 23 26L28 24V22Z" fill="#34d399" />
                <path d="M20 21L13 18C11.5 17.5 10 19 11 20.5L16 24C17.5 25 20 25 22 24L27 22.5V21H20Z" fill="#6ee7b7" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                OWED TO YOU
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {loading ? (
                  <span className="animate-pulse text-slate-400">...</span>
                ) : (
                  formatCurrency(Math.abs(owedToYou), currency)
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Friends owe you
              </p>
            </div>
          </div>

          {/* Trending Up Badge */}
          <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* 3. TOTAL NET BALANCE CARD */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white p-5 overflow-hidden shadow-lg shadow-blue-500/25">
        {/* Subtle Wave Graphic */}
        <svg
          className="absolute -bottom-1 right-0 w-full h-16 pointer-events-none opacity-20"
          viewBox="0 0 400 60"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 35C100 55 250 10 400 35V60H0V35Z"
            fill="white"
          />
        </svg>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3.5">
            {/* Frosted Glass Wallet Badge */}
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <Wallet className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block">
                TOTAL NET BALANCE
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mt-1">
                {loading ? (
                  <span className="animate-pulse text-blue-200">...</span>
                ) : (
                  formatCurrency(Math.abs(netBalance), currency)
                )}
              </div>
              <p className="text-xs text-blue-100/90 font-medium mt-1">
                {isNetPositive
                  ? netBalance === 0
                    ? 'You are all settled up!'
                    : 'Overall in the credit'
                  : 'Overall you owe money'}
              </p>
            </div>
          </div>

          {/* Action Arrow Button */}
          <button
            type="button"
            onClick={onViewActivity}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
            title="View Details"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceSummary;
