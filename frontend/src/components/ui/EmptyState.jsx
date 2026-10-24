import React from 'react';
import GlassButton from './GlassButton';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-100 my-4 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.03)]">
      {Icon && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-4 text-slate-400">
          <Icon className="w-10 h-10 stroke-[1.5]" />
        </div>
      )}

      {title && (
        <h4 className="text-lg font-bold text-slate-800 mb-2">{title}</h4>
      )}

      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div>
          {React.isValidElement(action) ? (
            action
          ) : (
            <GlassButton
              variant="primary"
              size="md"
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label || 'Get Started'}
            </GlassButton>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
