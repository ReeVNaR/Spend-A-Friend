import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';
import { currencies } from '../utils/currency';
import { User, Mail, LogOut, CheckCircle2 } from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [defaultCurrency, setDefaultCurrency] = useState(
    user?.defaultCurrency || 'INR'
  );
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await updateUser({
        name: name.trim(),
        defaultCurrency,
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Manage your account preferences and defaults.
        </p>
      </div>

      {/* User Header Profile Card */}
      <GlassCard className="p-6 sm:p-8 flex items-center space-x-5 border-blue-100 shadow-xs">
        <Avatar
          name={user?.name || 'User'}
          src={user?.avatar}
          size="xl"
          className="ring-4 ring-blue-500/20 shadow-md"
        />
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 truncate tracking-tight">
            {user?.name || 'User'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5">
            {user?.email}
          </p>
          <span className="inline-flex items-center space-x-1 mt-2 text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-2xs">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active Member</span>
          </span>
        </div>
      </GlassCard>

      {/* Profile Form */}
      <GlassCard className="p-6 sm:p-8 border-blue-100 shadow-xs">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <h3 className="text-lg font-bold text-slate-900 border-b border-blue-100 pb-3">
            Account Preferences
          </h3>

          <GlassInput
            label="Your Name"
            type="text"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <GlassInput
            label="Email Address (read-only)"
            type="email"
            icon={Mail}
            value={user?.email || ''}
            disabled
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Default Currency
            </label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="glass-input w-full text-sm cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="bg-white text-slate-800">
                  {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Used as the default currency for new expenses and dashboard summary.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <GlassButton
              type="submit"
              variant="primary"
              loading={loading}
            >
              Save Changes
            </GlassButton>
          </div>
        </form>
      </GlassCard>

      {/* Logout Card */}
      <GlassCard className="p-6 sm:p-8 border-blue-200 bg-blue-50/40 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-blue-800">
              Sign Out of Account
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              You will be redirected back to the login screen.
            </p>
          </div>

          <GlassButton
            type="button"
            variant="danger"
            icon={LogOut}
            onClick={logout}
          >
            Log Out
          </GlassButton>
        </div>
      </GlassCard>

      {/* App Version & Credits */}
      <div className="text-center text-xs text-slate-400 font-medium pt-4 pb-2">
        <p>Spend-A-Friend v1.0.0 • Pure White & Blue Liquid Edition</p>
        <p className="mt-1">Built with React, Vite, and Tailwind CSS</p>
      </div>
    </div>
  );
};

export default SettingsPage;
