import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import GlassCard from '../components/ui/GlassCard';
import GlassInput from '../components/ui/GlassInput';
import GlassButton from '../components/ui/GlassButton';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:gradient-bg flex items-center justify-center p-4 relative antialiased">
      {/* Background glow orbs in Pure Blue */}
      <div className="hidden md:block fixed top-[-10%] left-[-10%] w-[48vw] h-[48vw] rounded-full bg-sky-400/25 blur-[130px] pointer-events-none" />
      <div className="hidden md:block fixed bottom-[-10%] right-[-10%] w-[48vw] h-[48vw] rounded-full bg-blue-600/20 blur-[140px] pointer-events-none" />
      <div className="hidden md:block fixed top-[40%] right-[15%] w-[32vw] h-[32vw] rounded-full bg-cyan-400/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <GlassCard className="p-8 sm:p-10 border-blue-100 shadow-2xl backdrop-blur-3xl">
          {/* Logo & Headline */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/30 text-white relative animate-pop">
              <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  opacity="0.4"
                />
                <path d="M9 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3z" />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-blue-600 font-black text-xs flex items-center justify-center shadow-md border-2 border-blue-50">
                ₹
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Spend-A-<span className="text-blue-600">Friend</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              Split Smart. Stay Close.
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
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                icon={LogIn}
                fullWidth
              >
                Sign In
              </GlassButton>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4 ml-1"
            >
              Create Account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoginPage;
