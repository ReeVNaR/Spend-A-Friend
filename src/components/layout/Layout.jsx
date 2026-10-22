import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen gradient-bg text-slate-800 relative flex flex-col antialiased">
      {/* Background ambient liquid glow spheres in Pure Blue & Cyan */}
      <div className="fixed top-[-10%] left-[-10%] w-[48vw] h-[48vw] rounded-full bg-sky-400/25 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/15 blur-[150px] pointer-events-none" />
      <div className="fixed top-[35%] right-[10%] w-[38vw] h-[38vw] rounded-full bg-cyan-400/20 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[30%] left-[5%] w-[32vw] h-[32vw] rounded-full bg-blue-400/15 blur-[130px] pointer-events-none" />

      {/* Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-24 md:pb-12 relative z-10">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
