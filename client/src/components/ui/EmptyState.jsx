import React from 'react';
import GlassButton from './GlassButton';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-blue-100 my-4 shadow-xs">
      {Icon && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 mb-4 text-blue-600 shadow-xs">
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
