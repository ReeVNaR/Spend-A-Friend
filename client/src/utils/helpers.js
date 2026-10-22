import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : format(d, 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : format(d, 'MMM d, yyyy h:mm a');
};

export const timeAgo = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '' : formatDistanceToNow(d, { addSuffix: true });
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
};

// Pure White & Blue palette for avatars
export const generateColor = (str) => {
  const colors = [
    '#0071e3', // Apple Classic Blue
    '#0284c7', // Sky 600
    '#2563eb', // Royal Blue 600
    '#0ea5e9', // Vibrant Sky 500
    '#1d4ed8', // Deep Blue 700
    '#0369a1', // Ocean Blue 700
    '#3b82f6', // Bright Blue 500
    '#0284c7', // Azure 600
  ];
  if (!str) return colors[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const categoryIcons = {
  food: '🍔',
  transport: '🚗',
  accommodation: '🏨',
  shopping: '🛍️',
  entertainment: '🎮',
  utilities: '💡',
  medical: '🏥',
  other: '📦',
};

export const categoryLabels = {
  food: 'Food & Drinks',
  transport: 'Transportation',
  accommodation: 'Accommodation',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  utilities: 'Utilities',
  medical: 'Medical',
  other: 'General & Other',
};
