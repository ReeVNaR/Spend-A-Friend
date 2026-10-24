/**
 * Utility functions for parsing, validating, and generating Indian UPI URLs & deep links
 */

/**
 * Parse a raw scanned string or URI into structured UPI details.
 * Supports:
 * - standard `upi://pay?...`
 * - deep links like `tez://upi/pay?...`, `phonepe://upi/pay?...`
 * - plain UPI IDs like `merchant@okhdfcbank`
 */
export const parseUpiUri = (rawString = '') => {
  if (!rawString || typeof rawString !== 'string') return null;

  const trimmed = rawString.trim();

  // 1. Direct UPI ID format: username@bank
  const upiIdRegex = /^([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})$/;
  if (upiIdRegex.test(trimmed)) {
    const handle = trimmed.split('@')[0];
    const cleanName = handle
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      upiId: trimmed,
      payeeName: cleanName || 'Merchant',
      amount: null,
      currency: 'INR',
      note: 'Spend-A-Friend Expense',
      raw: trimmed,
    };
  }

  // 2. UPI URI scheme format (upi://pay?...)
  if (trimmed.toLowerCase().includes('upi://pay?') || trimmed.includes('?pa=')) {
    try {
      const queryString = trimmed.includes('?') ? trimmed.split('?')[1] : trimmed;
      const params = new URLSearchParams(queryString);

      // Support case-insensitive parameter lookups
      const getParam = (key) => {
        for (const [k, v] of params.entries()) {
          if (k.toLowerCase() === key.toLowerCase()) return decodeURIComponent(v || '').trim();
        }
        return '';
      };

      const upiId = getParam('pa');
      if (!upiId) return null;

      const payeeName = getParam('pn') || upiId.split('@')[0];
      const amStr = getParam('am');
      const amount = amStr && !isNaN(parseFloat(amStr)) ? parseFloat(amStr) : null;
      const currency = getParam('cu') || 'INR';
      const note = getParam('tn') || 'Spend-A-Friend Expense';
      const merchantCode = getParam('mc') || '';

      return {
        upiId,
        payeeName: payeeName.replace(/\+/g, ' '),
        amount,
        currency,
        note: note.replace(/\+/g, ' '),
        merchantCode,
        raw: trimmed,
      };
    } catch (e) {
      console.warn('Error parsing UPI URI:', e);
    }
  }

  return null;
};

/**
 * Generate UPI App Deep Link URI
 */
export const buildUpiDeepLink = ({
  app = 'default',
  upiId,
  payeeName = 'Friend',
  amount = 0,
  note = 'Spend-A-Friend Expense',
}) => {
  if (!upiId) return '#';

  const numAmt = parseFloat(amount);
  const amtQuery = !isNaN(numAmt) && numAmt > 0 ? `&am=${numAmt.toFixed(2)}` : '';
  const cleanName = encodeURIComponent(payeeName || 'Merchant');
  const cleanUpi = encodeURIComponent(upiId.trim());
  const cleanNote = encodeURIComponent(note || 'Spend-A-Friend Expense');

  const baseParams = `pa=${cleanUpi}&pn=${cleanName}${amtQuery}&cu=INR&tn=${cleanNote}`;

  switch (app) {
    case 'gpay':
      return `tez://upi/pay?${baseParams}`;
    case 'phonepe':
      return `phonepe://upi/pay?${baseParams}`;
    case 'paytm':
      return `paytmmp://upi/pay?${baseParams}`;
    default:
      return `upi://pay?${baseParams}`;
  }
};

/**
 * Intelligently detect expense category based on Merchant / Payee name and transaction note
 */
export const detectCategoryFromPayee = (name = '', note = '') => {
  const combined = `${name} ${note}`.toLowerCase();

  const rules = [
    {
      cat: 'food',
      keywords: [
        'cafe', 'coffee', 'tea', 'chai', 'starbucks', 'costa', 'restaurant',
        'food', 'dining', 'kitchen', 'bistro', 'pizza', 'dominos', 'burger',
        'mcdonald', 'kfc', 'subway', 'sweets', 'bakery', 'bar', 'pub', 'brew',
        'biryani', 'rasoi', 'thali', 'mess', 'canteen', 'dhaba', 'tiffin',
        'swiggy', 'zomato', 'eat', 'bake', 'snack', 'juice', 'chaat',
      ],
    },
    {
      cat: 'transport',
      keywords: [
        'cab', 'taxi', 'uber', 'ola', 'auto', 'rapido', 'fuel', 'petrol',
        'diesel', 'cng', 'hpcl', 'bpcl', 'iocl', 'fastag', 'toll', 'parking',
        'metro', 'rail', 'irctc', 'train', 'bus', 'flight', 'indigo', 'air',
      ],
    },
    {
      cat: 'groceries',
      keywords: [
        'mart', 'supermarket', 'grocery', 'provision', 'store', 'kirana',
        'bazaar', 'milk', 'dairy', 'fresh', 'vegetable', 'fruit', 'organic',
        'hypermarket', 'zepto', 'blinkit', 'instamart', 'bigbasket', 'dmart',
      ],
    },
    {
      cat: 'entertainment',
      keywords: [
        'cinema', 'movie', 'pvr', 'inox', 'cinepolis', 'film', 'game',
        'turf', 'bowling', 'club', 'amusement', 'ticket', 'show', 'netflix',
        'spotify', 'prime', 'hotstar', 'bookmyshow', 'concert',
      ],
    },
    {
      cat: 'utilities',
      keywords: [
        'electricity', 'power', 'gas', 'water', 'bescom', 'msedcl', 'broadband',
        'wifi', 'airtel', 'jio', 'vi', 'vodafone', 'recharge', 'bill', 'dth',
        'tata play', 'tatasky', 'cylinder',
      ],
    },
    {
      cat: 'shopping',
      keywords: [
        'fashion', 'apparel', 'retail', 'clothes', 'clothing', 'footwear',
        'trends', 'mall', 'electronics', 'zudio', 'reliance', 'pantaloons',
        'decathlon', 'ikea', 'myntra', 'amazon', 'flipkart', 'lifestyle', 'zara',
      ],
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => combined.includes(kw))) {
      return rule.cat;
    }
  }

  return 'food'; // default expense category
};
