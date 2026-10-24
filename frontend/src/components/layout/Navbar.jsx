import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Users, UserPlus, Settings, Activity } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const Navbar = () => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Groups', path: '/groups', icon: Users },
    { name: 'Friends', path: '/friends', icon: UserPlus },
    { name: 'Activity', path: '/activity', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Header (< md) - Persistent, Seamless across all pages */}
      <header className="md:hidden sticky top-0 left-0 right-0 z-30 px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 shrink-0">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
              <path d="M12 7L13.5 10.5M8 11L11 13M19 8L17.5 11" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="18" r="4.5" fill="#2563eb" />
              <path d="M8 34C8 28 12 24.5 17 24.5C18.5 24.5 20 25 21 26" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
              <path d="M8 34C8 35 9 36 10 36H18" fill="#2563eb" />
              <circle cx="32" cy="18" r="4.5" fill="#1d4ed8" />
              <path d="M40 34C40 28 36 24.5 31 24.5C29.5 24.5 28 25 27 26" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
              <path d="M40 34C40 35 39 36 38 36H30" fill="#1d4ed8" />
              <path d="M11 36C11 28.5 16 26 24 26C32 26 37 28.5 37 36H11Z" fill="#2563eb" />
              <text x="24" y="33.5" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif">₹</text>
            </svg>
          </div>
          <div>
            <div className="text-[17px] font-black tracking-tight text-slate-900 leading-tight">
              Spend-A-<span className="text-blue-600">Friend</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-tight">
              Split Smart. Stay Close.
            </div>
          </div>
        </Link>

        {/* User Avatar linking to /settings */}
        <Link
          to="/settings"
          className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-blue-500/20 active:scale-95 transition-transform"
          title="Account Settings"
        >
          {getInitials(user?.name)}
        </Link>
      </header>

      {/* Desktop Top Navbar (md+) */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-40 px-6 py-3">
        <div className="max-w-5xl mx-auto glass-strong rounded-2xl px-6 py-3 flex items-center justify-between border border-slate-200/80 shadow-xs">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20 text-white relative transition-transform group-hover:scale-105">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  opacity="0.4"
                />
                <path d="M9 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm0 2c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3z" />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white text-blue-600 font-extrabold text-[8px] flex items-center justify-center shadow-xs border border-blue-100">
                ₹
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Spend-A-<span className="text-blue-600">Friend</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 scale-[1.02]'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <Link
              to="/settings"
              className="flex items-center space-x-2.5 p-1.5 pl-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              <span className="text-sm font-semibold text-slate-700 hidden lg:inline-block">
                {user?.name || 'Account'}
              </span>
              <Avatar name={user?.name || 'User'} src={user?.avatar} size="sm" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (< md): Liquid Glass Floating Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-3.5 pt-1 pointer-events-none">
        <div className="liquid-glass-mobile rounded-3xl px-2 py-1.5 flex items-center justify-around pointer-events-auto border border-slate-200/80 shadow-[0_8px_30px_-6px_rgba(15,23,42,0.08)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center transition-all duration-200 select-none ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-600 px-3.5 py-1 rounded-2xl scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-600 px-2.5 py-1'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 mb-0.5 transition-colors ${
                        isActive ? 'text-blue-600 stroke-[2.4]' : 'text-slate-400 stroke-[1.8]'
                      }`}
                    />
                    <span
                      className={`text-[10px] tracking-tight leading-none ${
                        isActive ? 'font-bold text-blue-600' : 'font-medium text-slate-400'
                      }`}
                    >
                      {item.name}
                    </span>
                    {isActive && (
                      <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5 shadow-xs" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
