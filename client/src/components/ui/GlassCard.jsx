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
      className={`glass rounded-2xl p-6 text-slate-800 ${
        hover || isClickable
          ? 'cursor-pointer hover:bg-white/85 hover:shadow-xl hover:scale-[1.01] transition-all duration-300'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default GlassCard;
