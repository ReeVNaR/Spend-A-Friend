import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import toast from 'react-hot-toast';
import { currencies } from '../utils/currency';
import { User, Mail, Lock, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, defaultCurrency);
      toast.success('Account created successfully! Welcome!');
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Registration failed. Please check your information.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative antialiased">
      {/* Background glow orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[48vw] h-[48vw] rounded-full bg-cyan-400/20 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[48vw] h-[48vw] rounded-full bg-blue-600/20 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <GlassCard className="p-8 sm:p-10 border-blue-100 shadow-2xl backdrop-blur-3xl">
          {/* Logo & Headline */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-strong mb-3 text-3xl shadow-sm border border-blue-100">
              💸
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text">
              Spend-A-Friend
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Create an account to split bills seamlessly
            </p>
          </div>

          {error && (
            <div className="p-3 mb-5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs text-center font-semibold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              label="Full Name"
              type="text"
              icon={User}
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />

            <GlassInput
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <GlassInput
              label="Password (min 6 characters)"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <GlassInput
              label="Confirm Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
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
            </div>

            <div className="pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                icon={UserPlus}
                fullWidth
              >
                Create Account
              </GlassButton>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4 ml-1"
            >
              Sign In
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default RegisterPage;
