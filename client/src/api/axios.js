import frontendStore from '../services/frontendStore.js';
import { getExchangeRates, convertCurrency } from '../utils/currencyRates.js';

// Simulated delay helper for realistic feel (optional: 40ms)
const delay = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

const createError = (message, status = 400) => {
  const err = new Error(message);
  err.response = {
    status,
    data: {
      success: false,
      message,
    },
  };
  return err;
};

// URL parser to extract path and query params
const parseUrl = (rawUrl) => {
  // Strip baseURL or leading '/api' if present
  let url = rawUrl.replace(/^\/api/, '');
  if (!url.startsWith('/')) url = '/' + url;

  const [path, queryString] = url.split('?');
  const query = {};
  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [k, v] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return { path, query };
};

/**
 * Client-Side In-Browser API Adapter
 * Completely eliminates the need for any backend or database service.
 */
const api = {
  async get(rawUrl, config = {}) {
    await delay(20);
    const { path, query } = parseUrl(rawUrl);

    try {
      // 1. Auth routes
      if (path === '/auth/me') {
        const result = frontendStore.getMe();
        return { data: result };
      }

      // 2. Groups routes
      if (path === '/groups') {
        const result = frontendStore.getGroups();
        return { data: result };
      }

      const groupBalMatch = path.match(/^\/groups\/([^/]+)\/balances$/);
      if (groupBalMatch) {
        const groupId = groupBalMatch[1];
        const result = frontendStore.getGroupBalances(groupId);
        return { data: result };
      }

      const groupDetailMatch = path.match(/^\/groups\/([^/]+)$/);
      if (groupDetailMatch) {
        const groupId = groupDetailMatch[1];
        const result = frontendStore.getGroupById(groupId);
        return { data: result };
      }

      // 3. Expenses routes
      if (path === '/expenses') {
        const result = frontendStore.getExpenses(query);
        return { data: result };
      }

      // 4. Settlements routes
      if (path === '/settlements') {
        const result = frontendStore.getSettlements(query);
        return { data: result };
      }

      // 5. Friends routes
      if (path === '/friends/balances') {
        const result = frontendStore.getDashboardBalances();
        return { data: result };
      }

      if (path === '/friends') {
        const result = frontendStore.getFriends();
        return { data: result };
      }

      const friendDetailMatch = path.match(/^\/friends\/([^/]+)$/);
      if (friendDetailMatch) {
        const friendId = friendDetailMatch[1];
        const result = frontendStore.getFriendDetails(friendId);
        return { data: result };
      }

      // 6. Currency routes
      if (path === '/currency/rates') {
        const result = await getExchangeRates(query.base || 'USD');
        return { data: result };
      }

      if (path === '/currency/convert') {
        const result = await convertCurrency(query.amount, query.from, query.to);
        return { data: result };
      }

      // 7. Health check fallback
      if (path === '/health') {
        return {
          data: {
            success: true,
            status: 'frontend-managed',
            message: 'Spend-A-Friend is running 100% in frontend storage mode',
          },
        };
      }

      throw createError(`Endpoint ${path} not found`, 404);
    } catch (err) {
      if (err.response) throw err;
      throw createError(err.message || 'Operation failed', 400);
    }
  },

  async post(rawUrl, data = {}, config = {}) {
    await delay(30);
    const { path } = parseUrl(rawUrl);

    try {
      // 1. Auth
      if (path === '/auth/login') {
        const result = frontendStore.login(data.email, data.password);
        return { data: result };
      }

      if (path === '/auth/register') {
        const result = frontendStore.register(
          data.name,
          data.email,
          data.password,
          data.defaultCurrency
        );
        return { data: result };
      }

      // 2. Groups
      if (path === '/groups') {
        const result = frontendStore.createGroup(data);
        return { data: result };
      }

      if (path === '/groups/join') {
        const result = frontendStore.joinGroup(data.inviteCode);
        return { data: result };
      }

      // 3. Expenses
      if (path === '/expenses') {
        const result = frontendStore.createExpense(data);
        return { data: result };
      }

      // 4. Settlements
      if (path === '/settlements') {
        const result = frontendStore.createSettlement(data);
        return { data: result };
      }

      // 5. Friends
      if (path === '/friends/add' || path === '/friends') {
        const result = frontendStore.addFriend(data.email);
        return { data: result };
      }

      throw createError(`Endpoint ${path} not found`, 404);
    } catch (err) {
      if (err.response) throw err;
      throw createError(err.message || 'Action failed', 400);
    }
  },

  async put(rawUrl, data = {}, config = {}) {
    await delay(30);
    const { path } = parseUrl(rawUrl);

    try {
      if (path === '/auth/me') {
        const result = frontendStore.updateProfile(data);
        return { data: result };
      }

      throw createError(`Endpoint ${path} not found`, 404);
    } catch (err) {
      if (err.response) throw err;
      throw createError(err.message || 'Action failed', 400);
    }
  },

  async delete(rawUrl, config = {}) {
    await delay(20);
    const { path } = parseUrl(rawUrl);

    try {
      const expenseMatch = path.match(/^\/expenses\/([^/]+)$/);
      if (expenseMatch) {
        const expenseId = expenseMatch[1];
        const result = frontendStore.deleteExpense(expenseId);
        return { data: result };
      }

      const settlementMatch = path.match(/^\/settlements\/([^/]+)$/);
      if (settlementMatch) {
        const settlementId = settlementMatch[1];
        const result = frontendStore.deleteSettlement(settlementId);
        return { data: result };
      }

      throw createError(`Endpoint ${path} not found`, 404);
    } catch (err) {
      if (err.response) throw err;
      throw createError(err.message || 'Action failed', 400);
    }
  },

  // Stub interceptors for backwards compatibility if referenced
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};

export default api;
