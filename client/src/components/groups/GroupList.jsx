import React from 'react';
import GroupCard from './GroupCard';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import { Users, Plus } from 'lucide-react';
import GlassButton from '../ui/GlassButton';

const GroupList = ({
  groups = [],
  loading = false,
  onCreateClick,
  onJoinClick,
}) => {
  if (loading && (!groups || groups.length === 0)) {
    return <Loading text="Loading your groups..." />;
  }

  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No groups found"
        description="Create a group for your trip, housemates, or outings to start tracking shared expenses."
        action={
          <div className="flex items-center space-x-3">
            {onCreateClick && (
              <GlassButton variant="primary" icon={Plus} onClick={onCreateClick}>
                Create Group
              </GlassButton>
            )}
            {onJoinClick && (
              <GlassButton variant="secondary" onClick={onJoinClick}>
                Join Group
              </GlassButton>
            )}
          </div>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map((group) => (
        <GroupCard key={group._id || group.id} group={group} />
      ))}
    </div>
  );
};

export default GroupList;
