/**
 * Helper to safely extract string ID from either ObjectId or populated User object
 */
export const getUserIdString = (user) => {
  if (!user) return null;
  if (typeof user === 'string') return user;
  if (user._id) return user._id.toString();
  if (user.toString) return user.toString();
  return String(user);
};

/**
 * Calculates net balances and simplified debt transactions for a list of expenses and settlements.
 *
 * @param {Array} expenses - Array of Expense documents or objects
 * @param {Array} settlements - Array of Settlement documents or objects
 * @param {Array} members - Optional list of group member user objects or IDs
 * @returns {Object} { netBalances, simplifiedDebts, pairwiseBalances, summary }
 */
export const calculateBalances = (expenses = [], settlements = [], members = []) => {
  // Map of userId -> net amount (positive = owed money / creditor, negative = owes money / debtor)
  const netBalances = new Map();
  // Map of userId -> { paid: Number, share: Number, receivedSettlement: Number, paidSettlement: Number }
  const userBreakdown = new Map();

  // Initialize all known group members with 0 balance
  if (Array.isArray(members)) {
    for (const member of members) {
      const uId = getUserIdString(member.user || member);
      if (uId) {
        if (!netBalances.has(uId)) netBalances.set(uId, 0);
        if (!userBreakdown.has(uId)) {
          userBreakdown.set(uId, {
            paid: 0,
            share: 0,
            paidSettlement: 0,
            receivedSettlement: 0,
          });
        }
      }
    }
  }

  const ensureUser = (uId) => {
    if (!netBalances.has(uId)) netBalances.set(uId, 0);
    if (!userBreakdown.has(uId)) {
      userBreakdown.set(uId, {
        paid: 0,
        share: 0,
        paidSettlement: 0,
        receivedSettlement: 0,
      });
    }
  };

  let totalExpenses = 0;
  let totalSettlements = 0;

  // Pairwise directed debt tracking: pairwise[debtor][creditor] = amount
  const directDebts = new Map();

  const recordDirectDebt = (debtorId, creditorId, amount) => {
    if (debtorId === creditorId || amount <= 0) return;
    const key = `${debtorId}->${creditorId}`;
    directDebts.set(key, (directDebts.get(key) || 0) + amount);
  };

  // 1. Process Expenses
  for (const exp of expenses) {
    const expenseAmount = Number(exp.convertedAmount ?? exp.amount ?? 0);
    if (isNaN(expenseAmount) || expenseAmount <= 0) continue;

    totalExpenses += expenseAmount;
    const payerId = getUserIdString(exp.paidBy);
    if (!payerId) continue;

    ensureUser(payerId);
    netBalances.set(payerId, netBalances.get(payerId) + expenseAmount);
    userBreakdown.get(payerId).paid += expenseAmount;

    if (Array.isArray(exp.splits) && exp.splits.length > 0) {
      for (const split of exp.splits) {
        const participantId = getUserIdString(split.user);
        const splitAmount = Number(split.amount || 0);

        if (!participantId || isNaN(splitAmount) || splitAmount <= 0) continue;

        ensureUser(participantId);
        netBalances.set(participantId, netBalances.get(participantId) - splitAmount);
        userBreakdown.get(participantId).share += splitAmount;

        // In pairwise debt: participant owes payer the splitAmount
        if (participantId !== payerId) {
          recordDirectDebt(participantId, payerId, splitAmount);
        }
      }
    }
  }

  // 2. Process Settlements
  for (const set of settlements) {
    const settlementAmount = Number(set.amount || 0);
    if (isNaN(settlementAmount) || settlementAmount <= 0) continue;

    totalSettlements += settlementAmount;
    const fromId = getUserIdString(set.from);
    const toId = getUserIdString(set.to);

    if (!fromId || !toId || fromId === toId) continue;

    ensureUser(fromId);
    ensureUser(toId);

    // fromId paid money to clear debt: their net increases (+amount)
    netBalances.set(fromId, netBalances.get(fromId) + settlementAmount);
    userBreakdown.get(fromId).paidSettlement += settlementAmount;

    // toId received money: their net decreases (-amount)
    netBalances.set(toId, netBalances.get(toId) - settlementAmount);
    userBreakdown.get(toId).receivedSettlement += settlementAmount;

    // Settlement reduces debt of fromId -> toId (or increases direct credit)
    const directKey = `${fromId}->${toId}`;
    directDebts.set(directKey, (directDebts.get(directKey) || 0) - settlementAmount);
  }

  // 3. Round net balances to 2 decimal places & construct net balance summary
  const netBalancesObj = {};
  const debtors = [];
  const creditors = [];

  for (const [userId, net] of netBalances.entries()) {
    const roundedNet = Math.round(net * 100) / 100;
    netBalancesObj[userId] = roundedNet;

    if (roundedNet < -0.01) {
      debtors.push({ userId, amount: Math.abs(roundedNet) });
    } else if (roundedNet > 0.01) {
      creditors.push({ userId, amount: roundedNet });
    }
  }

  // 4. Greedy Debt Simplification Algorithm
  // Minimize the number of transactions required to settle all debts
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplifiedDebts = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    const settleAmount = Math.min(debtor.amount, creditor.amount);
    const roundedSettle = Math.round(settleAmount * 100) / 100;

    if (roundedSettle > 0) {
      simplifiedDebts.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: roundedSettle,
      });
    }

    debtor.amount = Math.round((debtor.amount - roundedSettle) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - roundedSettle) * 100) / 100;

    if (debtor.amount <= 0.01) {
      debtorIndex++;
    }
    if (creditor.amount <= 0.01) {
      creditorIndex++;
    }
  }

  // Convert breakdown map to plain object
  const breakdownObj = {};
  for (const [userId, stats] of userBreakdown.entries()) {
    breakdownObj[userId] = {
      paid: Math.round(stats.paid * 100) / 100,
      share: Math.round(stats.share * 100) / 100,
      paidSettlement: Math.round(stats.paidSettlement * 100) / 100,
      receivedSettlement: Math.round(stats.receivedSettlement * 100) / 100,
      netBalance: netBalancesObj[userId] || 0,
    };
  }

  return {
    netBalances: netBalancesObj,
    simplifiedDebts,
    userBreakdown: breakdownObj,
    summary: {
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalSettlements: Math.round(totalSettlements * 100) / 100,
      expenseCount: expenses.length,
      settlementCount: settlements.length,
    },
  };
};

export default calculateBalances;
