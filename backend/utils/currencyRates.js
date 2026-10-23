// Supported currencies
export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

// Base exchange rates relative to USD (fallback / default)
export const DEFAULT_RATES = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  AUD: 1.52,
  CAD: 1.37,
};

// Cache exchange rates in memory with 1 hour TTL
let cachedRates = { ...DEFAULT_RATES };
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch latest exchange rates from open API or fallback to defaults
 */
export const getExchangeRates = async (baseCurrency = 'USD') => {
  const normalizedBase = (baseCurrency || 'USD').toUpperCase();
  const now = Date.now();

  // Try fetching fresh rates if cache expired
  if (now - lastFetchTime > CACHE_TTL_MS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          const freshRates = {};
          for (const curr of SUPPORTED_CURRENCIES) {
            freshRates[curr] = data.rates[curr] || DEFAULT_RATES[curr];
          }
          cachedRates = freshRates;
          lastFetchTime = now;
        }
      }
    } catch (err) {
      // Network failure or timeout: keep using cached or default rates
      console.warn('Could not fetch external currency rates, using fallback rates:', err.message);
    }
  }

  // Base conversion if requested base is not USD
  const baseRateToUSD = cachedRates[normalizedBase] || DEFAULT_RATES[normalizedBase] || 1;
  const ratesForBase = {};

  for (const curr of SUPPORTED_CURRENCIES) {
    const rateAgainstUSD = cachedRates[curr] || DEFAULT_RATES[curr];
    // rate = targetRate / baseRate
    ratesForBase[curr] = Number((rateAgainstUSD / baseRateToUSD).toFixed(6));
  }

  return {
    base: normalizedBase,
    rates: ratesForBase,
    lastUpdated: new Date(lastFetchTime || now).toISOString(),
  };
};

/**
 * Convert an amount from one currency to another
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  const from = (fromCurrency || 'INR').toUpperCase();
  const to = (toCurrency || 'INR').toUpperCase();
  const numAmount = Number(amount);

  if (isNaN(numAmount) || numAmount < 0) {
    throw new Error('Invalid amount for conversion');
  }

  if (from === to) {
    return {
      from,
      to,
      originalAmount: numAmount,
      convertedAmount: numAmount,
      rate: 1,
    };
  }

  const { rates } = await getExchangeRates(from);
  const rate = rates[to] || (DEFAULT_RATES[to] / DEFAULT_RATES[from]);
  const convertedAmount = Number((numAmount * rate).toFixed(2));

  return {
    from,
    to,
    originalAmount: numAmount,
    convertedAmount,
    rate: Number(rate.toFixed(4)),
  };
};
