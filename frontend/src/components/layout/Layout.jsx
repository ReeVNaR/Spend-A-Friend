import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import PwaInstallPrompt from '../ui/PwaInstallPrompt';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-slate-800 relative flex flex-col antialiased selection:bg-blue-500/15 selection:text-blue-900">
      {/* Navigation (Desktop Top Bar + Mobile Top Header + Mobile Bottom Dock) */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 md:pt-24 pb-28 md:pb-14 relative z-10">
        {children || <Outlet />}
      </main>

      {/* Floating PWA Install Banner */}
      <PwaInstallPrompt />
    </div>
  );
};

export default Layout;
