import React from 'react';
import FriendCard from './FriendCard';
import Loading from '../ui/Loading';
import EmptyState from '../ui/EmptyState';
import { UserPlus, UserCheck } from 'lucide-react';

const FriendList = ({
  friends = [],
  loading = false,
  onAddClick,
  currency = 'INR',
}) => {
  if (loading && (!friends || friends.length === 0)) {
    return <Loading text="Loading friends..." />;
  }

  if (!friends || friends.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="No friends found"
        description="Add friends by their email address to start splitting individual bills and expenses."
        action={
          onAddClick
            ? {
                label: 'Add Friend',
                onClick: onAddClick,
                icon: UserCheck,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((item) => {
        // Can be { friend, balance } or direct user object with balance
        const friendObj = item.friend || item.user || item;
        const balance = item.balance !== undefined ? item.balance : friendObj.balance;
        return (
          <FriendCard
            key={friendObj._id || friendObj.id}
            friend={friendObj}
            balance={balance}
            currency={currency}
          />
        );
      })}
    </div>
  );
};

export default FriendList;
