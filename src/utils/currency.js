export const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export const getCurrencySymbol = (code) => {
  return currencies.find((c) => c.code === code)?.symbol || code || '₹';
};

export const formatCurrency = (amount, currencyCode = 'INR') => {
  const symbol = getCurrencySymbol(currencyCode);
  const num = Number(amount) || 0;
  const absAmount = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${absAmount}`;
};
