import React from 'react';

const Loading = ({ text = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing glow */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 blur-lg opacity-35 animate-pulse" />
        
        {/* Animated spinner ring */}
        <div className="absolute w-12 h-12 rounded-full border-3 border-transparent border-t-blue-600 border-r-sky-400 animate-spin" />
        
        {/* Center dot */}
        <div className="absolute w-4 h-4 rounded-full bg-white shadow-md ring-1 ring-blue-100" />
      </div>

      {text && (
        <p className="text-sm font-semibold text-slate-600 animate-pulse tracking-wide">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
