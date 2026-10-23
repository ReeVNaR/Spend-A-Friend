import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import Avatar from '../ui/Avatar';
import { Users, Compass, Home, Heart, MoreHorizontal } from 'lucide-react';

const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  if (!group) return null;

  const typeConfig = {
    trip: { label: 'Trip', icon: Compass, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    home: { label: 'Home', icon: Home, color: 'text-sky-700 bg-sky-50 border-sky-200' },
    couple: { label: 'Couple', icon: Heart, color: 'text-blue-800 bg-blue-50 border-blue-200' },
    other: { label: 'General', icon: MoreHorizontal, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
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
      className="p-5 flex flex-col justify-between h-48 border-blue-100/80 hover:border-blue-400 relative overflow-hidden group shadow-xs"
    >
      {/* Top Header: Title and Type Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors tracking-tight">
            {group.name}
          </h3>
          {group.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
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
      <div className="flex items-center justify-between pt-4 border-t border-blue-50 mt-auto">
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
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
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
