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

      {/* Mobile Top Brand Bar (< md): Liquid Glass Floating Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 px-3.5 pt-3 pb-1">
        <div className="liquid-glass-mobile rounded-2xl px-4 py-2.5 flex items-center justify-between border border-white/90">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl">💸</span>
            <span className="font-extrabold text-base tracking-tight gradient-text">
              Spend-A-Friend
            </span>
          </Link>
          <Link to="/settings" className="p-0.5 rounded-full ring-2 ring-white/90 shadow-2xs">
            <Avatar name={user?.name || 'User'} src={user?.avatar} size="xs" />
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (< md): Liquid Glass Floating Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3.5 pb-3.5 pt-1 pointer-events-none">
        <div className="liquid-glass-mobile rounded-2xl px-1.5 py-1.5 flex items-center justify-around pointer-events-auto border border-white/90">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? 'text-blue-600 font-bold bg-blue-50/90 shadow-2xs scale-[1.03] border border-blue-100/60'
                      : 'text-slate-500 hover:text-slate-900 active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${
                        isActive ? 'scale-110 text-blue-600' : 'text-slate-500'
                      }`}
                    />
                    <span className="text-[10px] tracking-tight">{item.name}</span>
                    {isActive && (
                      <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-blue-600 shadow-xs" />
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
