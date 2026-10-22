import React, { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import Avatar from '../ui/Avatar';
import { categoryIcons, formatDate } from '../../utils/helpers';
import { formatCurrency } from '../../utils/currency';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const ExpenseCard = ({ expense, currentUserId, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  if (!expense) return null;

  const payerId = expense.paidBy?._id || expense.paidBy;
  const payerName = expense.paidBy?.name || 'Someone';
  const isPayer = String(payerId) === String(currentUserId);

  const splits = expense.splits || [];
  const mySplit = splits.find(
    (s) => String(s.user?._id || s.user) === String(currentUserId)
  );

  let statusText = 'Not involved';
  let statusColor = 'text-slate-400';
  let userAmountDisplay = null;

  if (isPayer) {
    const myShare = mySplit ? Number(mySplit.amount) : 0;
    const lentAmount = Math.max(0, Number(expense.amount) - myShare);
    if (lentAmount > 0) {
      statusText = 'You get back';
      userAmountDisplay = formatCurrency(lentAmount, expense.currency);
      statusColor = 'text-sky-600';
    } else {
      statusText = 'You paid for yourself';
      userAmountDisplay = formatCurrency(expense.amount, expense.currency);
      statusColor = 'text-slate-700';
    }
  } else if (mySplit) {
    statusText = 'You owe';
    userAmountDisplay = formatCurrency(mySplit.amount, expense.currency);
    statusColor = 'text-blue-800';
  }

  const categoryEmoji = categoryIcons[expense.category] || '📦';

  return (
    <GlassCard
      className="p-4 sm:p-5 transition-all duration-200 hover:border-blue-200 shadow-xs border-blue-100/70"
      onClick={() => setExpanded(!expanded)}
      hover
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Category Icon + Description & Info */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl glass-strong flex items-center justify-center text-2xl shrink-0 shadow-2xs border border-blue-100">
            {categoryEmoji}
          </div>

          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate capitalize tracking-tight">
              {expense.description}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5 font-medium">
              <span>{formatDate(expense.date || expense.createdAt)}</span>
              <span>•</span>
              <span className="truncate">
                Paid by{' '}
                <strong className="text-slate-800 font-semibold">
                  {isPayer ? 'You' : payerName}
                </strong>
              </span>
              {expense.group && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 font-semibold truncate">
                    {expense.group.name || 'Group'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Net Impact & Total */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <div className={`text-base font-extrabold ${statusColor}`}>
              {userAmountDisplay || formatCurrency(expense.amount, expense.currency)}
            </div>
            <div className="text-xs text-slate-400 font-medium">{statusText}</div>
          </div>

          <div className="text-slate-400">
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Split Breakdown */}
      {expanded && (
        <div
          className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1">
            <span>Total Expense: {formatCurrency(expense.amount, expense.currency)}</span>
            <span className="capitalize">Split: {expense.splitType || 'Equal'}</span>
          </div>

          {expense.notes && (
            <p className="text-xs text-slate-600 italic bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/70">
              "{expense.notes}"
            </p>
          )}

          {/* Participant Breakdown */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-700 block">
              Participants Breakdown:
            </span>
            {splits.map((s, idx) => {
              const participantName = s.user?.name || `Participant ${idx + 1}`;
              const isMe = String(s.user?._id || s.user) === String(currentUserId);
              return (
                <div
                  key={s.user?._id || s.user || idx}
                  className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-blue-50/40 border border-blue-100/50 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar name={participantName} size="xs" />
                    <span className={isMe ? 'font-bold text-blue-700' : 'text-slate-700 font-medium'}>
                      {isMe ? 'You' : participantName}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(s.amount, expense.currency)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Optional Action Buttons */}
          {onDelete && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => onDelete(expense._id || expense.id)}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Expense</span>
              </button>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default ExpenseCard;
