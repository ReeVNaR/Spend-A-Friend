import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, Users, UserPlus, Settings, Activity } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';

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
      {/* Desktop Top Navbar (md+) */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-40 px-6 py-3">
        <div className="max-w-7xl mx-auto glass-strong rounded-2xl px-6 py-3 flex items-center justify-between border border-blue-100 shadow-lg">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <span className="text-2xl transition-transform group-hover:scale-110">💸</span>
            <span className="font-extrabold text-xl tracking-tight gradient-text">
              Spend-A-Friend
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
                    `flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
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
              className="flex items-center space-x-2.5 p-1.5 pl-3 rounded-xl hover:bg-blue-50/60 transition-colors border border-transparent hover:border-blue-200"
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
        <div className="liquid-glass-mobile rounded-3xl px-2 py-1.5 flex items-center justify-around pointer-events-auto border border-white/95 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.1)]">
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
                      ? 'bg-blue-50/90 text-blue-600 px-3.5 py-1 rounded-2xl scale-[1.03]'
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
