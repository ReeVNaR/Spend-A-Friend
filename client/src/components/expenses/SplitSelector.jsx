import React from 'react';
import Avatar from '../ui/Avatar';
import { Check } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const SplitSelector = ({
  type = 'equal',
  onChange,
  members = [],
  splits = [],
  onSplitsChange,
  totalAmount = 0,
  currency = 'INR',
}) => {
  const splitTypes = [
    { id: 'equal', label: 'Split Equally' },
    { id: 'exact', label: 'Exact Amounts' },
    { id: 'percentage', label: 'By Percentage' },
  ];

  // Helper to extract member ID
  const getMemberId = (m) => m._id || m.id || (m.user && (m.user._id || m.user)) || m;
  const getMemberName = (m) => m.name || (m.user && m.user.name) || 'User';

  const isMemberSelected = (memberId) => {
    return splits.some((s) => (s.user === memberId || s.user?._id === memberId));
  };

  const handleToggleMember = (member) => {
    const memberId = getMemberId(member);
    const exists = isMemberSelected(memberId);

    let newSplits;
    if (exists) {
      if (splits.length <= 1) return; // Keep at least one
      newSplits = splits.filter((s) => (s.user !== memberId && s.user?._id !== memberId));
    } else {
      newSplits = [...splits, { user: memberId, amount: 0, percentage: 0 }];
    }

    // Recalculate based on current type
    if (type === 'equal') {
      const count = newSplits.length;
      const share = count > 0 ? Math.round((Number(totalAmount) / count) * 100) / 100 : 0;
      newSplits = newSplits.map((s) => ({ ...s, amount: share }));
    }

    onSplitsChange(newSplits);
  };

  const handleExactChange = (memberId, val) => {
    const num = parseFloat(val) || 0;
    const newSplits = splits.map((s) => {
      if (s.user === memberId || s.user?._id === memberId) {
        return { ...s, amount: num };
      }
      return s;
    });
    onSplitsChange(newSplits);
  };

  const handlePercentageChange = (memberId, val) => {
    const perc = parseFloat(val) || 0;
    const numTotal = Number(totalAmount) || 0;
    const calcAmount = Math.round(((numTotal * perc) / 100) * 100) / 100;
    const newSplits = splits.map((s) => {
      if (s.user === memberId || s.user?._id === memberId) {
        return { ...s, percentage: perc, amount: calcAmount };
      }
      return s;
    });
    onSplitsChange(newSplits);
  };

  // Calculations for summaries
  const totalAllocated = splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  const remainingAmount = Math.round((Number(totalAmount) - totalAllocated) * 100) / 100;

  const totalPercentage = splits.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0);
  const remainingPercentage = Math.round((100 - totalPercentage) * 100) / 100;

  return (
    <div className="space-y-4">
      {/* Split Type Selector Pills */}
      <div className="flex p-1 rounded-xl bg-blue-50/70 border border-blue-100 shadow-inner">
        {splitTypes.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => {
              onChange(st.id);
              // Recalculate if switching to equal
              if (st.id === 'equal' && splits.length > 0) {
                const count = splits.length;
                const share = Math.round((Number(totalAmount) / count) * 100) / 100;
                onSplitsChange(splits.map((s) => ({ ...s, amount: share })));
              }
            }}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              type === st.id
                ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
                : 'text-slate-500 hover:text-blue-700'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Summary / validation note */}
      <div className="flex items-center justify-between text-xs px-1 font-medium">
        <span className="text-slate-500">
          Splitting between {splits.length} participant{splits.length === 1 ? '' : 's'}
        </span>
        {type === 'exact' && (
          <span
            className={`font-semibold ${
              Math.abs(remainingAmount) < 0.01 ? 'text-sky-600' : 'text-blue-800'
            }`}
          >
            {Math.abs(remainingAmount) < 0.01
              ? '✓ Balanced'
              : remainingAmount > 0
              ? `Remaining: ${formatCurrency(remainingAmount, currency)}`
              : `Over by: ${formatCurrency(Math.abs(remainingAmount), currency)}`}
          </span>
        )}
        {type === 'percentage' && (
          <span
            className={`font-semibold ${
              Math.abs(remainingPercentage) < 0.01 ? 'text-sky-600' : 'text-blue-800'
            }`}
          >
            {Math.abs(remainingPercentage) < 0.01
              ? '✓ Total 100%'
              : `Total: ${totalPercentage}% (${remainingPercentage > 0 ? `${remainingPercentage}% left` : `${Math.abs(remainingPercentage)}% over`})`}
          </span>
        )}
        {type === 'equal' && splits.length > 0 && (
          <span className="text-blue-700 font-bold">
            {formatCurrency(
              Math.round((Number(totalAmount || 0) / splits.length) * 100) / 100,
              currency
            )}{' '}
            each
          </span>
        )}
      </div>

      {/* Member Selection List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {members.map((member) => {
          const mId = getMemberId(member);
          const name = getMemberName(member);
          const isSelected = isMemberSelected(mId);
          const currentSplit = splits.find(
            (s) => s.user === mId || s.user?._id === mId
          );

          return (
            <div
              key={mId}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'glass bg-white/95 border-blue-200 shadow-2xs'
                  : 'bg-blue-50/30 border-blue-100/60 opacity-65'
              }`}
            >
              {/* Member toggle item */}
              <div
                className="flex items-center space-x-3 cursor-pointer flex-1"
                onClick={() => handleToggleMember(member)}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-blue-200 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <Avatar name={name} size="sm" />
                <span className="text-sm font-semibold text-slate-800">{name}</span>
              </div>

              {/* Exact or Percentage Input if selected */}
              {isSelected && type === 'exact' && (
                <div className="flex items-center space-x-1.5 w-28">
                  <span className="text-xs text-slate-400 font-medium">{currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentSplit?.amount ?? ''}
                    onChange={(e) => handleExactChange(mId, e.target.value)}
                    className="glass-input py-1 px-2 text-right text-xs rounded-lg w-full font-semibold"
                    placeholder="0.00"
                  />
                </div>
              )}

              {isSelected && type === 'percentage' && (
                <div className="flex items-center space-x-1.5 w-24">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={currentSplit?.percentage ?? ''}
                    onChange={(e) => handlePercentageChange(mId, e.target.value)}
                    className="glass-input py-1 px-2 text-right text-xs rounded-lg w-full font-semibold"
                    placeholder="0"
                  />
                  <span className="text-xs text-slate-400 font-medium">%</span>
                </div>
              )}

              {isSelected && type === 'equal' && (
                <div className="text-xs text-slate-800 font-bold px-2">
                  {formatCurrency(currentSplit?.amount || 0, currency)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SplitSelector;
