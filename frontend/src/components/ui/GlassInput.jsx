import React from 'react';

const GlassInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  name,
  required = false,
  disabled = false,
  className = '',
  rows,
  as,
  ...rest
}) => {
  const isTextarea = as === 'textarea' || Boolean(rows);
  const Component = isTextarea ? 'textarea' : 'input';

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && !isTextarea && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <Component
          type={isTextarea ? undefined : type}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`glass-input w-full text-sm text-slate-800 ${Icon && !isTextarea ? 'pl-10' : 'pl-4'} ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...rest}
        />
      </div>

      {error && <span className="text-xs text-rose-600 font-medium mt-1">{error}</span>}
    </div>
  );
};

export default GlassInput;
