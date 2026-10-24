import React, { useState, useEffect } from 'react';
import GlassModal from '../ui/GlassModal';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { currencies } from '../../utils/currency';
import { Users, Compass, Home, Heart, MoreHorizontal, Globe, CheckCircle2 } from 'lucide-react';

const EditGroupModal = ({ isOpen, onClose, group, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('trip');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setType(group.type || 'other');
      setCurrency(group.currency || 'INR');
    }
  }, [group]);

  const groupTypes = [
    { id: 'trip', label: 'Trip', icon: Compass },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'couple', label: 'Couple', icon: Heart },
    { id: 'other', label: 'Other', icon: MoreHorizontal },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/groups/${group._id || group.id}`, {
        name: name.trim(),
        description: description.trim(),
        type,
        currency,
      });

      toast.success('Group updated successfully!');
      onSuccess?.(res.data?.group || res.data);
      onClose();
    } catch (err) {
      console.error('Failed to update group:', err);
      toast.error(err.response?.data?.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Edit Group Details" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Group Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip 2026, Apartment 404"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Description (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief note or destination description"
            className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Group Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Group Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {groupTypes.map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Default Group Currency
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Actions - Sticky Bottom Toolbar */}
        <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 py-3 sm:px-6 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-end space-x-2.5 z-10 shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.06)] mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </GlassModal>
  );
};

export default EditGroupModal;
