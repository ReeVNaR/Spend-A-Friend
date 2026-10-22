import React, { useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';
import { currencies } from '../utils/currency';
import frontendStore from '../services/frontendStore';
import {
  User,
  Mail,
  LogOut,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Database,
} from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [defaultCurrency, setDefaultCurrency] = useState(
    user?.defaultCurrency || 'INR'
  );
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleExportData = () => {
    try {
      const dataStr = frontendStore.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spend-a-friend-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content === 'string') {
          frontendStore.importData(content);
          toast.success('Data restored successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (err) {
        toast.error('Failed to restore backup: Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all data? This will log you out and clear all stored data.'
      )
    ) {
      frontendStore.clearAllData();
      toast.success('All data cleared!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Manage your account preferences and frontend data storage.
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
            <span>Frontend Storage Active</span>
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

      {/* Data Management (Frontend Storage & Backup) */}
      <GlassCard className="p-6 sm:p-8 border-blue-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 border-b border-blue-100 pb-3">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">
            Frontend Data Management
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          All your friends, groups, expenses, and settlements are managed securely inside your browser's local storage with zero server latency. You can backup or transfer your data at any time.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <GlassButton
            type="button"
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportData}
            fullWidth
          >
            Backup (JSON)
          </GlassButton>

          <GlassButton
            type="button"
            variant="secondary"
            size="sm"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            fullWidth
          >
            Restore Backup
          </GlassButton>

          <GlassButton
            type="button"
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            onClick={handleClearData}
            fullWidth
          >
            Clear All Data
          </GlassButton>
        </div>
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
        <p>Spend-A-Friend v1.0.0 • Pure White & Blue Liquid Glass (Client-Managed)</p>
        <p className="mt-1">Zero Backend • Zero Config • 100% Free Vercel Static Deployment</p>
      </div>
    </div>
  );
};

export default SettingsPage;
