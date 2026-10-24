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
      const transactionRef = getParam('tr') || '';

      return {
        upiId,
        payeeName: payeeName.replace(/\+/g, ' '),
        amount,
        currency,
        note: note.replace(/\+/g, ' '),
        merchantCode,
        transactionRef,
        raw: trimmed,
      };
    } catch (e) {
      console.warn('Error parsing UPI URI:', e);
    }
  }

  return null;
};

/**
 * Generate UPI App Deep Link URI with strict NPCI compliance.
 * - P2P (friend to friend): Clean URI with NO fake `tr`, preventing "exceeded limit" bank blocks.
 * - P2M (merchants): Includes `mc` and `tr` as required by acquiring banks.
 */
export const buildUpiDeepLink = ({
  app = 'default',
  upiId,
  payeeName = 'Friend',
  amount = 0,
  note = 'Spend-A-Friend Settlement',
  merchantCode = '',
  transactionRef = '',
  includeAmount = true,
  rawUri = '',
}) => {
  if (!upiId && !rawUri) return '#';

  // If we have a raw merchant URI from a scanned QR and no amount override needed
  if (rawUri && rawUri.toLowerCase().includes('upi://pay?')) {
    const numAmt = parseFloat(amount);
    let target = rawUri;
    if (includeAmount && !isNaN(numAmt) && numAmt > 0 && !rawUri.includes('am=')) {
      target += `&am=${numAmt.toFixed(2)}`;
    }
    const queryString = target.split('?')[1] || '';
    switch (app) {
      case 'gpay':
        return `tez://upi/pay?${queryString}`;
      case 'phonepe':
        return `phonepe://upi/pay?${queryString}`;
      case 'paytm':
        return `paytmmp://upi/pay?${queryString}`;
      default:
        return `upi://pay?${queryString}`;
    }
  }

  const numAmt = parseFloat(amount);
  const amtQuery =
    includeAmount && !isNaN(numAmt) && numAmt > 0
      ? `&am=${numAmt.toFixed(2)}`
      : '';

  // Clean payee name (NPCI requires alphanumeric and spaces only)
  const cleanPayee = (payeeName || 'Friend')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim() || 'Friend';

  const cleanNote = (note || 'Spend-A-Friend')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, 30) || 'Settlement';

  const cleanUpi = encodeURIComponent(upiId ? upiId.trim() : '');
  const encodedName = encodeURIComponent(cleanPayee);
  const encodedNote = encodeURIComponent(cleanNote);

  // CRITICAL NPCI FIX:
  // `tr` (Transaction Reference) and `mc` (Merchant Code) are EXCLUSIVELY for registered merchants.
  // Including a fake `tr` on a personal P2P handle flags it as a spoofed merchant transaction,
  // causing Google Pay to immediately reject it with "You have exceeded the limit for this payment"!
  let merchantParams = '';
  if (merchantCode) {
    const tr = transactionRef || `SAF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    merchantParams = `&mc=${encodeURIComponent(merchantCode)}&tr=${encodeURIComponent(tr)}`;
  }

  const baseParams = `pa=${cleanUpi}&pn=${encodedName}${amtQuery}&cu=INR&tn=${encodedNote}${merchantParams}`;

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
 * Returns native Android app launch intents or URI schemes so user can paste UPI ID
 * directly in-app, bypassing all web browser P2P intent blocks completely.
 */
export const getAppLaunchUrl = (app = 'gpay') => {
  switch (app) {
    case 'gpay':
      return 'intent://#Intent;package=com.google.android.apps.nbu.paisa.user;scheme=https;end;';
    case 'phonepe':
      return 'intent://#Intent;package=com.phonepe.app;scheme=https;end;';
    case 'paytm':
      return 'intent://#Intent;package=net.one97.paytm;scheme=https;end;';
    default:
      return 'upi://pay';
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
