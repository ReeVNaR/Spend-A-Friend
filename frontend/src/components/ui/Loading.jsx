import React from 'react';

const Loading = ({ text = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />

      {text && (
        <p className="text-xs font-semibold text-slate-400 tracking-wide">
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
