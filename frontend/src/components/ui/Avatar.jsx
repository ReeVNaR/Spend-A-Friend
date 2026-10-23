import React, { useState } from 'react';
import { getInitials, generateColor } from '../../utils/helpers';

const Avatar = ({
  name = 'User',
  src,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-lg font-bold',
  };

  const initials = getInitials(name);
  const bgColor = generateColor(name);
  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none overflow-hidden ring-2 ring-white/20 shadow-md ${currentSizeClass} ${className}`}
      style={{ backgroundColor: !src || imageError ? bgColor : 'transparent' }}
      title={name}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-white drop-shadow-sm font-medium tracking-wider">
          {initials}
        </span>
      )}
    </div>
  );
};

export default Avatar;
