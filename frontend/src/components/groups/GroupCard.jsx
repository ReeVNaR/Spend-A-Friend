import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import Avatar from '../ui/Avatar';
import { Users, Compass, Home, Heart, MoreHorizontal } from 'lucide-react';

const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  if (!group) return null;

  const typeConfig = {
    trip: { label: 'Trip', icon: Compass, color: 'text-blue-700 bg-blue-50/70 border-blue-100' },
    home: { label: 'Home', icon: Home, color: 'text-indigo-700 bg-indigo-50/70 border-indigo-100' },
    couple: { label: 'Couple', icon: Heart, color: 'text-rose-700 bg-rose-50/70 border-rose-100' },
    other: { label: 'General', icon: MoreHorizontal, color: 'text-slate-700 bg-slate-50 border-slate-200' },
  };

  const currentType = typeConfig[group.type] || typeConfig.other;
  const TypeIcon = currentType.icon;

  const members = group.members || [];
  const maxDisplay = 4;
  const displayedMembers = members.slice(0, maxDisplay);
  const remainingCount = members.length - maxDisplay;

  return (
    <GlassCard
      hover
      onClick={() => navigate(`/groups/${group._id || group.id}`)}
      className="p-5 flex flex-col justify-between h-48 border border-slate-100/90 hover:border-slate-300 relative overflow-hidden group shadow-[0_2px_10px_-2px_rgba(15,23,42,0.03)] bg-white rounded-3xl"
    >
      {/* Top Header: Title and Type Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors tracking-tight">
            {group.name}
          </h3>
          {group.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-medium">
              {group.description}
            </p>
          )}
        </div>

        <span
          className={`inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full border shrink-0 font-semibold ${currentType.color}`}
        >
          <TypeIcon className="w-3 h-3" />
          <span>{currentType.label}</span>
        </span>
      </div>

      {/* Bottom Footer: Member Avatars + Count */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
        <div className="flex items-center -space-x-2 overflow-hidden">
          {displayedMembers.map((m, idx) => {
            const memberUser = m.user || m;
            const name = memberUser.name || 'Member';
            return (
              <Avatar
                key={memberUser._id || idx}
                name={name}
                src={memberUser.avatar}
                size="sm"
                className="ring-2 ring-white shadow-2xs"
              />
            );
          })}

          {remainingCount > 0 && (
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
              +{remainingCount}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
          <Users className="w-3.5 h-3.5" />
          <span>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

export default GroupCard;
