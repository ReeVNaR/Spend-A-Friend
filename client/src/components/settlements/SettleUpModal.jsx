import React, { useState, useEffect } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { currencies } from '../../utils/currency';
import { DollarSign, Calendar } from 'lucide-react';

const SettleUpModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedUser = null,
  preselectedAmount = '',
  groupId = null,
  groupMembers = [],
  friends = [],
}) => {
  const { user } = useAuth();

  const [toUser, setToUser] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Combine available recipients (excluding current user)
  const candidates = React.useMemo(() => {
    const list = [];
    const seen = new Set();
    const currentId = user?._id || user?.id;

    const addCandidate = (cand) => {
      if (!cand) return;
      const u = cand.user || cand.friend || cand;
      const uid = u._id || u.id;
      if (uid && String(uid) !== String(currentId) && !seen.has(String(uid))) {
        seen.add(String(uid));
        list.push({ _id: uid, name: u.name || 'User', email: u.email });
      }
    };

    if (preselectedUser) addCandidate(preselectedUser);
    groupMembers.forEach(addCandidate);
    friends.forEach(addCandidate);

    return list;
  }, [preselectedUser, groupMembers, friends, user]);

  // Synchronize when modal opens
  useEffect(() => {
    if (isOpen) {
      if (preselectedUser) {
        setToUser(preselectedUser._id || preselectedUser.id || preselectedUser);
      } else if (candidates.length > 0) {
        setToUser(candidates[0]._id || candidates[0].id);
      }

      if (preselectedAmount) {
        setAmount(String(Math.abs(Number(preselectedAmount))));
      } else {
        setAmount('');
      }
    }
  }, [isOpen, preselectedUser, preselectedAmount, candidates]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!toUser) {
      toast.error('Please select the recipient to settle up with');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid settlement amount');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        to: toUser,
        amount: numAmount,
        currency,
        notes: notes.trim(),
        date: new Date(date).toISOString(),
      };
      if (groupId) {
        payload.group = groupId;
      }

      const res = await api.post('/settlements', payload);
      toast.success('Settlement recorded successfully!');
      setAmount('');
      setNotes('');
      onSuccess?.(res.data?.settlement || res.data);
      onClose();
    } catch (err) {
      console.error('Failed to record settlement:', err);
      toast.error(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Settle Up" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Who are you paying?
          </label>
          <select
            value={toUser}
            onChange={(e) => setToUser(e.target.value)}
            className="glass-input w-full text-sm cursor-pointer"
            required
          >
            {candidates.length === 0 ? (
              <option value="">No friends or group members available</option>
            ) : (
              candidates.map((c) => (
                <option key={c._id} value={c._id} className="bg-white text-slate-800">
                  {c.name} {c.email ? `(${c.email})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Amount & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <GlassInput
            label="Amount Paid"
            type="number"
            step="0.01"
            min="0.01"
            icon={DollarSign}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="bg-white text-slate-800">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <GlassInput
          label="Date of Payment"
          type="date"
          icon={Calendar}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        {/* Notes */}
        <GlassInput
          as="textarea"
          rows={2}
          label="Payment Method / Notes (Optional)"
          placeholder="e.g. Paid via Google Pay, UPI, Cash"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
            Record Payment
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};

export default SettleUpModal;
