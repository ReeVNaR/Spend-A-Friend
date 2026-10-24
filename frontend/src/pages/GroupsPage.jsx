import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../api/axios';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import JoinGroupModal from '../components/groups/JoinGroupModal';
import Avatar from '../components/ui/Avatar';
import {
  Plus,
  KeyRound,
  Users,
  Compass,
  Home,
  Heart,
  MoreHorizontal,
  Search,
  ChevronRight,
} from 'lucide-react';

const getInitials = (name) => {
  if (!name) return 'RA';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const typeConfig = {
  trip: { label: 'Trip', icon: Compass, bg: 'bg-blue-50', text: 'text-blue-600' },
  home: { label: 'Home', icon: Home, bg: 'bg-sky-50', text: 'text-sky-600' },
  couple: { label: 'Couple', icon: Heart, bg: 'bg-rose-50', text: 'text-rose-500' },
  other: { label: 'General', icon: MoreHorizontal, bg: 'bg-amber-50', text: 'text-amber-600' },
};

const GroupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      const list = res.data?.groups || res.data || [];
      setGroups(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.name?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.inviteCode?.toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Heading Section */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Your <span className="text-blue-600 font-black">Groups</span> 👥
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Manage your trips, flatmates, and shared household expenses.
        </p>
      </div>

      {/* 2. Quick Action Cards (2-Column Action Row) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {/* Create Group Card */}
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-3 p-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-[0.98] transition-all text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight">
              Create Group
            </div>
            <div className="text-[10px] text-blue-100 font-medium leading-tight mt-0.5 truncate hidden xs:block">
              Start new split
            </div>
          </div>
        </button>

        {/* Join with Code Card */}
        <button
          type="button"
          onClick={() => setIsJoinOpen(true)}
          className="flex items-center space-x-3 p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-300 text-slate-900 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <KeyRound className="w-4 h-4 text-slate-700 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight">
              Join Group
            </div>
            <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate hidden xs:block">
              Enter invite code
            </div>
          </div>
        </button>
      </div>

      {/* 3. Search Bar */}
      {groups.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search groups by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 focus:bg-white border border-slate-200/80 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-2xs"
          />
        </div>
      )}

      {/* 4. Group List (Clean Rounded Card Container) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All Groups ({filteredGroups.length})
          </h3>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 font-medium border border-slate-200/80 shadow-2xs animate-pulse">
            Loading your groups...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
              👥
            </div>
            <div className="text-sm font-bold text-slate-900">No groups found</div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Create a group for trips, roommates, or dinner bills to split expenses automatically.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Your First Group</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-2 sm:p-2.5 border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)] divide-y divide-slate-100">
            {filteredGroups.map((group) => {
              const currentType = typeConfig[group.type] || typeConfig.other;
              const TypeIcon = currentType.icon;
              const members = group.members || [];
              const displayedMembers = members.slice(0, 3);

              return (
                <div
                  key={group._id || group.id}
                  onClick={() => navigate(`/groups/${group._id || group.id}`)}
                  className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50/60 rounded-2xl transition-colors cursor-pointer group"
                >
                  {/* Left: Type Icon & Name */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl ${currentType.bg} ${currentType.text} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                    >
                      <TypeIcon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate tracking-tight">
                        {group.name}
                      </div>
                      <div className="text-xs text-slate-400 font-medium truncate mt-0.5 flex items-center space-x-2">
                        <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
                        <span>•</span>
                        <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                          {group.inviteCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Members avatars & Chevron */}
                  <div className="flex items-center space-x-2.5 shrink-0 ml-2">
                    <div className="hidden xs:flex items-center -space-x-1.5 overflow-hidden">
                      {displayedMembers.map((m, idx) => {
                        const mUser = m.user || m;
                        return (
                          <Avatar
                            key={mUser._id || idx}
                            name={mUser.name || 'Member'}
                            src={mUser.avatar}
                            size="xs"
                            className="ring-2 ring-white"
                          />
                        );
                      })}
                      {members.length > 3 && (
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                          +{members.length - 3}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchGroups()}
      />

      <JoinGroupModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSuccess={() => fetchGroups()}
      />
    </div>
  );
};

export default GroupsPage;
