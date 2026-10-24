import React, { useState } from 'react';
import GlassModal from '../ui/GlassModal';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { currencies } from '../../utils/currency';
import { Users, Compass, Home, Heart, MoreHorizontal } from 'lucide-react';

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('trip');
  const [currency, setCurrency] = useState(user?.defaultCurrency || 'INR');
  const [loading, setLoading] = useState(false);

  const groupTypes = [
    { id: 'trip', label: 'Trip', icon: Compass },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'couple', label: 'Couple', icon: Heart },
    { id: 'other', label: 'Other', icon: MoreHorizontal },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/groups', {
        name: name.trim(),
        description: description.trim(),
        type,
        currency,
      });

      toast.success('Group created successfully!');
      setName('');
      setDescription('');
      setType('trip');
      onSuccess?.(res.data?.group || res.data);
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Create New Group" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <GlassInput
          label="Group Name"
          icon={Users}
          placeholder="e.g. Goa Trip 2026, Apartment 404, Dinner Club"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <GlassInput
          as="textarea"
          rows={2}
          label="Description (Optional)"
          placeholder="What's this group for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Group Type Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            Group Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {groupTypes.map((gt) => {
              const Icon = gt.icon;
              const isSelected = type === gt.id;
              return (
                <button
                  key={gt.id}
                  type="button"
                  onClick={() => setType(gt.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-semibold">{gt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Default Group Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="glass-input w-full text-sm cursor-pointer"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code} className="bg-white text-slate-800">
                {c.code} ({c.symbol}) - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 py-3 sm:px-6 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-end space-x-2.5 z-10 shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.06)] mt-4">
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
            Create Group
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};

export default CreateGroupModal;
