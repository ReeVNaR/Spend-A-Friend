import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import FriendList from '../components/friends/FriendList';
import AddFriendModal from '../components/friends/AddFriendModal';
import GlassButton from '../components/ui/GlassButton';
import GlassInput from '../components/ui/GlassInput';
import { UserPlus, Search } from 'lucide-react';

const FriendsPage = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/friends');
      const list = res.data?.friends || res.data || [];
      setFriends(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter((item) => {
      const f = item.friend || item.user || item;
      return (
        f.name?.toLowerCase().includes(query) ||
        f.email?.toLowerCase().includes(query)
      );
    });
  }, [friends, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Friends
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Track 1-on-1 expenses and settle up directly with friends.
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="md"
          icon={UserPlus}
          onClick={() => setIsAddOpen(true)}
        >
          Add Friend
        </GlassButton>
      </div>

      {/* Search Bar */}
      {friends.length > 0 && (
        <div className="max-w-md">
          <GlassInput
            icon={Search}
            placeholder="Search friends by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Friend List */}
      <FriendList
        friends={filteredFriends}
        loading={loading}
        onAddClick={() => setIsAddOpen(true)}
        currency={user?.defaultCurrency || 'INR'}
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => fetchFriends()}
      />
    </div>
  );
};

export default FriendsPage;
