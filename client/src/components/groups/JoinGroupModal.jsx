import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassModal from '../ui/GlassModal';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';

const JoinGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/groups/join', { inviteCode: cleanCode });
      toast.success('Joined group successfully!');
      const joinedGroup = res.data?.group || res.data;
      setInviteCode('');
      onSuccess?.(joinedGroup);
      onClose();
      if (joinedGroup?._id || joinedGroup?.id) {
        navigate(`/groups/${joinedGroup._id || joinedGroup.id}`);
      }
    } catch (err) {
      console.error('Failed to join group:', err);
      toast.error(err.response?.data?.message || 'Failed to join group. Check the invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Join a Group" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Ask a group member or admin for their 6-character group invite code to join.
        </p>

        <GlassInput
          label="6-Character Invite Code"
          icon={KeyRound}
          placeholder="e.g. 7X9K2B"
          value={inviteCode}
          maxLength={8}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className="uppercase tracking-widest text-center font-mono font-bold text-violet-700"
          required
        />

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200/80">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            variant="primary"
            loading={loading}
          >
            Join Group
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};

export default JoinGroupModal;
