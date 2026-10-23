import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import Avatar from '../ui/Avatar';
import { formatCurrency } from '../../utils/currency';
import { ChevronRight } from 'lucide-react';

const FriendCard = ({ friend, balance = 0, currency = 'INR' }) => {
  const navigate = useNavigate();

  if (!friend) return null;

  const friendId = friend._id || friend.id;
  const numBalance = Number(balance) || Number(friend.balance) || 0;
  const isSettled = Math.abs(numBalance) < 0.01;
  const owesYou = numBalance > 0.01;
  const youOwe = numBalance < -0.01;

  let balanceText = 'Settled up';
  let balanceColor = 'text-slate-400';

  if (owesYou) {
    balanceText = 'owes you';
    balanceColor = 'text-emerald-600';
  } else if (youOwe) {
    balanceText = 'you owe';
    balanceColor = 'text-rose-600';
  }

  return (
    <GlassCard
      hover
      onClick={() => navigate(`/friends/${friendId}`)}
      className="p-4 sm:p-5 flex items-center justify-between border-white/80 hover:border-violet-300 shadow-sm"
    >
      {/* Left: Avatar + Details */}
      <div className="flex items-center space-x-3.5 min-w-0">
        <Avatar name={friend.name} src={friend.avatar} size="md" />
        <div className="min-w-0">
          <h4 className="text-base font-bold text-slate-900 truncate">
            {friend.name}
          </h4>
          <p className="text-xs text-slate-500 truncate font-medium">{friend.email}</p>
        </div>
      </div>

      {/* Right: Net Balance Status */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="text-right">
          {isSettled ? (
            <span className="text-xs font-bold text-slate-400">Settled up</span>
          ) : (
            <>
              <div className="text-xs text-slate-500 font-medium">{balanceText}</div>
              <div className={`text-base font-extrabold ${balanceColor}`}>
                {formatCurrency(Math.abs(numBalance), currency)}
              </div>
            </>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </GlassCard>
  );
};

export default FriendCard;
