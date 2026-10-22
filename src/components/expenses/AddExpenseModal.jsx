import React, { useState, useEffect, useMemo } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import SplitSelector from './SplitSelector';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { currencies } from '../../utils/currency';
import { categoryIcons, categoryLabels } from '../../utils/helpers';
import { FileText, DollarSign, Calendar } from 'lucide-react';

const AddExpenseModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedGroup = null,
  preselectedFriend = null,
  groups = [],
}) => {
  const { user } = useAuth();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR');
  const [category, setCategory] = useState('food');
  const [selectedGroupId, setSelectedGroupId] = useState(
    preselectedGroup?._id || preselectedGroup?.id || ''
  );
  const [paidBy, setPaidBy] = useState(user?._id || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [splitType, setSplitType] = useState('equal');
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Determine active group object
  const activeGroup = useMemo(() => {
    if (preselectedGroup) return preselectedGroup;
    if (selectedGroupId) {
      return groups.find((g) => (g._id || g.id) === selectedGroupId);
    }
    return null;
  }, [preselectedGroup, selectedGroupId, groups]);

  // Determine available members for splitting
  const availableMembers = useMemo(() => {
    if (activeGroup && activeGroup.members) {
      return activeGroup.members.map((m) => (m.user ? m.user : m));
    }
    if (preselectedFriend) {
      return [
        { _id: user?._id, name: `${user?.name || 'You'} (You)` },
        {
          _id: preselectedFriend._id || preselectedFriend.id,
          name: preselectedFriend.name,
        },
      ];
    }
    return [{ _id: user?._id, name: `${user?.name || 'You'} (You)` }];
  }, [activeGroup, preselectedFriend, user]);

  // Initialize splits whenever available members or amount changes
  useEffect(() => {
    if (availableMembers.length > 0) {
      const numAmount = parseFloat(amount) || 0;
      const count = availableMembers.length;
      const share = count > 0 ? Math.round((numAmount / count) * 100) / 100 : 0;
      const perc = count > 0 ? Math.round(100 / count) : 0;

      setSplits(
        availableMembers.map((m) => ({
          user: m._id || m.id,
          amount: share,
          percentage: perc,
        }))
      );
    }
  }, [availableMembers, amount]);

  // Sync paidBy when user is loaded
  useEffect(() => {
    if (user?._id && !paidBy) {
      setPaidBy(user._id);
    }
  }, [user, paidBy]);

  // Sync group currency if active group has one
  useEffect(() => {
    if (activeGroup?.currency) {
      setCurrency(activeGroup.currency);
    }
  }, [activeGroup]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter an expense description');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (splits.length === 0) {
      toast.error('Please select at least one person to split with');
      return;
    }

    // Validation per split type
    let finalSplits = [];
    if (splitType === 'equal') {
      const count = splits.length;
      const share = Math.round((numAmount / count) * 100) / 100;
      let runningSum = 0;
      finalSplits = splits.map((s, idx) => {
        const amt = idx === count - 1 ? Math.round((numAmount - runningSum) * 100) / 100 : share;
        runningSum += amt;
        return {
          user: s.user?._id || s.user,
          amount: amt,
        };
      });
    } else if (splitType === 'exact') {
      const sum = splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
      if (Math.abs(sum - numAmount) > 0.05) {
        toast.error(`Splits sum (${sum.toFixed(2)}) must equal total amount (${numAmount.toFixed(2)})`);
        return;
      }
      finalSplits = splits.map((s) => ({
        user: s.user?._id || s.user,
        amount: Number(s.amount) || 0,
      }));
    } else if (splitType === 'percentage') {
      const totalPerc = splits.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0);
      if (Math.abs(totalPerc - 100) > 0.5) {
        toast.error(`Total percentage must equal 100% (currently ${totalPerc}%)`);
        return;
      }
      finalSplits = splits.map((s) => ({
        user: s.user?._id || s.user,
        amount: Math.round(((numAmount * Number(s.percentage || 0)) / 100) * 100) / 100,
      }));
    }

    const payload = {
      description: description.trim(),
      amount: numAmount,
      currency,
      category,
      paidBy,
      splitType,
      splits: finalSplits,
      date: new Date(date).toISOString(),
      notes: notes.trim(),
    };

    if (selectedGroupId) {
      payload.group = selectedGroupId;
    }

    setLoading(true);
    try {
      const res = await api.post('/expenses', payload);
      toast.success('Expense added successfully!');
      setDescription('');
      setAmount('');
      setNotes('');
      onSuccess?.(res.data?.expense || res.data);
      onClose();
    } catch (err) {
      console.error('Failed to add expense:', err);
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Add New Expense" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Description & Amount row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <GlassInput
              label="Description"
              icon={FileText}
              placeholder="e.g. Dinner, Taxi, Groceries"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <GlassInput
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              icon={DollarSign}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Currency & Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Currency */}
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

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              {Object.keys(categoryIcons).map((cat) => (
                <option key={cat} value={cat} className="bg-white text-slate-800">
                  {categoryIcons[cat]} {categoryLabels[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <GlassInput
              label="Date"
              type="date"
              icon={Calendar}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Group selector if not preselected */}
        {!preselectedGroup && groups.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Group (Optional)
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              <option value="" className="bg-white text-slate-800">
                Individual / Non-group Expense
              </option>
              {groups.map((g) => (
                <option
                  key={g._id || g.id}
                  value={g._id || g.id}
                  className="bg-white text-slate-800"
                >
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Paid By Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Paid By
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="glass-input w-full text-sm cursor-pointer"
            required
          >
            {availableMembers.map((m) => {
              const mId = m._id || m.id;
              const isMe = String(mId) === String(user?._id);
              return (
                <option key={mId} value={mId} className="bg-white text-slate-800">
                  {isMe ? `You (${user?.name})` : m.name}
                </option>
              );
            })}
          </select>
        </div>

        {/* Split Section */}
        <div className="pt-2 border-t border-slate-200/80">
          <label className="text-sm font-bold text-slate-900 block mb-2">
            Split Breakdown
          </label>
          <SplitSelector
            type={splitType}
            onChange={setSplitType}
            members={availableMembers}
            splits={splits}
            onSplitsChange={setSplits}
            totalAmount={parseFloat(amount) || 0}
            currency={currency}
          />
        </div>

        {/* Optional Notes */}
        <div>
          <GlassInput
            as="textarea"
            rows={2}
            label="Notes (Optional)"
            placeholder="Add any extra details or receipt remarks..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Modal Actions */}
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
            Save Expense
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};

export default AddExpenseModal;
