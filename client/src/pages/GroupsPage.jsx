import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import GroupList from '../components/groups/GroupList';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import JoinGroupModal from '../components/groups/JoinGroupModal';
import GlassButton from '../components/ui/GlassButton';
import { Plus, KeyRound } from 'lucide-react';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your Groups
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Manage your trips, roommates, and shared household expenses.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <GlassButton
            variant="secondary"
            size="md"
            icon={KeyRound}
            onClick={() => setIsJoinOpen(true)}
          >
            Join Group
          </GlassButton>

          <GlassButton
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsCreateOpen(true)}
          >
            Create Group
          </GlassButton>
        </div>
      </div>

      {/* Group Cards Grid */}
      <GroupList
        groups={groups}
        loading={loading}
        onCreateClick={() => setIsCreateOpen(true)}
        onJoinClick={() => setIsJoinOpen(true)}
      />

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
