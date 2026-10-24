import React from 'react';

const GlassCard = ({
  children,
  className = '',
  onClick,
  hover = false,
  role,
  tabIndex,
  ...rest
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={role || (isClickable ? 'button' : undefined)}
      tabIndex={tabIndex !== undefined ? tabIndex : isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
      className={`bg-white rounded-3xl p-6 text-slate-800 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] ${
        hover || isClickable
          ? 'cursor-pointer hover:border-slate-200 hover:shadow-[0_8px_30px_-6px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default GlassCard;
