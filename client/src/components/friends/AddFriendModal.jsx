import React, { useState } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

const AddFriendModal = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      let res;
      try {
        res = await api.post('/friends/add', { email: cleanEmail });
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.post('/friends', { email: cleanEmail });
        } else {
          throw err;
        }
      }

      toast.success(res.data?.message || 'Friend added successfully!');
      setEmail('');
      onSuccess?.(res.data?.friend || res.data?.user || res.data);
      onClose();
    } catch (err) {
      console.error('Failed to add friend:', err);
      toast.error(err.response?.data?.message || 'Failed to find or add user with this email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Add Friend" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Enter your friend's registered email address to connect and track expenses together.
        </p>

        <GlassInput
          label="Friend's Email Address"
          type="email"
          icon={Mail}
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            Add Friend
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};

export default AddFriendModal;
