import React from 'react';
import GlassCard from '../ui/GlassCard';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import { ArrowRight, ArrowRightLeft } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { formatCurrency } from '../../utils/currency';

const SettlementList = ({
  settlements = [],
  loading = false,
  currentUserId,
}) => {
  if (loading && (!settlements || settlements.length === 0)) {
    return <Loading text="Loading settlements..." />;
  }

  if (!settlements || settlements.length === 0) {
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title="No settlements recorded"
        description="Whenever someone settles a debt or pays back, records will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement) => {
        const fromUser = settlement.from || {};
        const toUser = settlement.to || {};
        const fromName = fromUser.name || 'User';
        const toName = toUser.name || 'User';

        const isFromMe = String(fromUser._id || fromUser) === String(currentUserId);
        const isToMe = String(toUser._id || toUser) === String(currentUserId);

        return (
          <GlassCard
            key={settlement._id || settlement.id}
            className="p-4 flex items-center justify-between border-blue-100/80 shadow-xs"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ArrowRightLeft className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-800 truncate">
                  <span className={isFromMe ? 'text-blue-700 font-bold' : ''}>
                    {isFromMe ? 'You' : fromName}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className={isToMe ? 'text-blue-700 font-bold' : ''}>
                    {isToMe ? 'You' : toName}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span>{formatDate(settlement.date || settlement.createdAt)}</span>
                  {settlement.notes && (
                    <>
                      <span>•</span>
                      <span className="italic truncate text-slate-600">{settlement.notes}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-base font-extrabold text-blue-600">
                +{formatCurrency(settlement.amount, settlement.currency)}
              </span>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Settled
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};

export default SettlementList;
