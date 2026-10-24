import React, { useState, useEffect } from 'react';
import GlassModal from '../ui/GlassModal';
import Avatar from '../ui/Avatar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Mail, UserPlus, Check, Plus, Users, Search } from 'lucide-react';

const AddMemberModal = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  existingMembers = [],
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState(null);
  const [searchFriend, setSearchFriend] = useState('');

  // Fetch friends to allow 1-click addition
  useEffect(() => {
    if (!isOpen) return;
    const fetchFriends = async () => {
      try {
        const res = await api.get('/friends');
        const list = res.data?.friends || res.data || [];
        setFriends(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load friends for group invite:', err);
      }
    };
    fetchFriends();
  }, [isOpen]);

  // Set of existing member IDs
  const existingMemberIds = new Set(
    existingMembers.map((m) => String(m.user?._id || m.user?.id || m.user || m._id || m.id))
  );

  const handleAddByEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/groups/${groupId}/members`, { email: email.trim().toLowerCase() });
      toast.success('Member added to group successfully!');
      setEmail('');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to add member:', err);
      toast.error(err.response?.data?.message || 'Failed to add member to group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friendUser) => {
    const friendId = friendUser._id || friendUser.id;
    setAddingFriendId(friendId);
    try {
      await api.post(`/groups/${groupId}/members`, { userId: friendId });
      toast.success(`${friendUser.name || 'Friend'} added to group!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to add friend to group:', err);
      toast.error(err.response?.data?.message || 'Failed to add friend');
    } finally {
      setAddingFriendId(null);
    }
  };

  // Filter friends not already in group
  const availableFriends = friends
    .map((f) => f.friend || f.user || f)
    .filter((f) => f && f._id && !existingMemberIds.has(String(f._id)))
    .filter((f) => {
      if (!searchFriend.trim()) return true;
      const q = searchFriend.toLowerCase();
      return (
        f.name?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q)
      );
    });

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Add Member to Group" size="md">
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Group Name Banner */}
        <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 truncate">
              {groupName || 'Group'}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Invite friends or add members by their email
            </div>
          </div>
        </div>

        {/* 1. Add by Email Form */}
        <form onSubmit={handleAddByEmail} className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Add via Email
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add'}</span>
            </button>
          </div>
        </form>

        {/* 2. Quick Add From Friends List */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Quick Add From Friends
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              {availableFriends.length} available
            </span>
          </div>

          {friends.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search friend..."
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
          )}

          {availableFriends.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400 font-medium">
              {friends.length === 0
                ? 'No friends yet. You can add members by email above.'
                : 'All your friends are already in this group!'}
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {availableFriends.map((friend) => {
                const isAdding = addingFriendId === (friend._id || friend.id);
                return (
                  <div
                    key={friend._id || friend.id}
                    className="p-2 sm:p-2.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/50 border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Avatar name={friend.name} src={friend.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {friend.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {friend.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddFriend(friend)}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 active:scale-95 text-xs font-bold shadow-2xs transition-all flex items-center space-x-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAdding ? 'Adding...' : 'Add'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </GlassModal>
  );
};

export default AddMemberModal;
