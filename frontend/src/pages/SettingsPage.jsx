import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';
import { currencies } from '../utils/currency';
import api from '../api/axios';
import {
  User,
  Mail,
  LogOut,
  CheckCircle2,
  Lock,
  Globe,
  ShieldCheck,
  ChevronRight,
  Info,
  QrCode,
  Zap,
  KeyRound,
  Smartphone,
  Download,
  Share,
  PlusSquare,
} from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [defaultCurrency, setDefaultCurrency] = useState(
    user?.defaultCurrency || 'INR'
  );
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [loading, setLoading] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  React.useEffect(() => {
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent) && !window.MSStream);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsStandalone(true);
        toast.success('Spend-A-Friend installed successfully!');
      }
    } else if (isIOS) {
      setShowIosGuide(true);
    } else {
      toast('To install: Tap your browser menu (⋮) and select "Install App" or "Add to Home Screen".');
    }
  };

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
        upiId: upiId.trim(),
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      await api.put('/auth/me', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to change password:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  // Initials for avatar
  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. Mobile Brand Header */}
      <div className="flex md:hidden items-center justify-between pt-1 pb-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white relative">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                opacity="0.4"
              />
              <path d="M9 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3z" />
            </svg>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-blue-600 font-extrabold text-[9px] flex items-center justify-center shadow-xs border border-blue-100">
              ₹
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
              Spend-A-<span className="text-blue-600">Friend</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
              Split Smart. Stay Close.
            </div>
          </div>
        </div>

        <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs border-2 border-white">
          {userInitials}
        </div>
      </div>

      {/* 2. Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Settings & Profile ⚙️
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Manage your account preferences, payments, and security
        </p>
      </div>

      {/* 3. User Header Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
        <div className="relative">
          <Avatar
            name={user?.name || 'User'}
            src={user?.avatar}
            size="lg"
            className="ring-4 ring-blue-50 shadow-xs"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 truncate tracking-tight">
            {user?.name || 'User'}
          </h2>
          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
            {user?.email}
          </p>
          <span className="inline-flex items-center space-x-1 mt-2 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-bold shadow-2xs">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active Member</span>
          </span>
        </div>
      </div>

      {/* 4. Profile Form Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-50 flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Account Details</span>
          </h3>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Your Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Email Field (Read Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Email Address
              </label>
              <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Read-only</span>
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100/70 border border-slate-200/60 text-xs sm:text-sm font-medium text-slate-400 cursor-not-allowed select-none shadow-2xs"
              />
            </div>
          </div>

          {/* UPI ID / VPA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Your UPI ID / VPA (Optional)
              </label>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                <Zap className="w-2.5 h-2.5" />
                <span>1-Tap Settlement</span>
              </span>
            </div>
            <div className="relative">
              <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. rahul@okhdfcbank or 9876543210@paytm"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Friends can tap to pay you directly via Google Pay, PhonePe, or Paytm with prefilled amounts.
            </p>
          </div>

          {/* Default Currency */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Default Currency
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all cursor-pointer"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Applied automatically when creating new expenses and summary calculations.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl py-2.5 px-6 font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
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
      </div>

      {/* 5. Change Password Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-50 flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Change Password</span>
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-2xs transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pwLoading}
              className="bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-2xl py-2.5 px-6 font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {pwLoading ? (
                <span>Updating Password...</span>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 6. Native App Installation Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">App Installation</h3>
          </div>
          {isStandalone ? (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Installed as App</span>
            </span>
          ) : (
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
              PWA Ready
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 p-2">
            <img
              src="/icon-192.png"
              alt="Spend-A-Friend"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-900 tracking-tight">
              Spend-A-Friend Native App
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isStandalone
                ? 'You are running Spend-A-Friend as an installed standalone native application.'
                : 'Install Spend-A-Friend directly on your phone or PC with offline caching.'}
            </p>
          </div>
        </div>

        {!isStandalone && (
          <button
            type="button"
            onClick={handleTriggerInstall}
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Install Spend-A-Friend App</span>
          </button>
        )}
      </div>

      {/* iOS Guide Modal in Settings */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-slate-900 shadow-2xl border border-slate-100 space-y-4 animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  📲
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Install on iPhone / iPad
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    2 simple steps to add to Home Screen
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    Tap the Share Button in Safari
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                    <span>Look for</span>
                    <Share className="w-3.5 h-3.5 inline text-blue-600" />
                    <span>in your browser menu bar.</span>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    Select &quot;Add to Home Screen&quot;
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                    <span>Scroll down and tap</span>
                    <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />
                    <span><strong>Add to Home Screen</strong>.</span>
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 7. App Information & About */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-50 flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>App Information</span>
        </h3>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-500 font-medium">Application</span>
          <span className="font-bold text-slate-800">Spend-A-Friend Web App</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-500 font-medium">Version</span>
          <span className="font-mono font-bold text-blue-600">v2.1.0 (with UPI Pay)</span>
        </div>
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-500 font-medium">Environment</span>
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
            <ShieldCheck className="w-3 h-3" />
            <span>Secure & Connected</span>
          </span>
        </div>
      </div>

      {/* 7. Logout / Danger Zone Card */}
      <div className="bg-rose-50/50 rounded-3xl p-5 border border-rose-100/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-rose-800">
              Sign Out of Account
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              You will need to sign in again to access your shared expenses and groups.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl py-2.5 px-4 font-bold text-xs shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
