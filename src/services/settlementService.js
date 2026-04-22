const Expense = require("../models/expenseModel");
const { formatPaiseToAmount } = require("../utils/money");

const getDisplayName = (userMap, userId) => userMap.get(userId)?.name || userId;

const computeRawBalancesFromExpenses = (expenses) => {
  const userMap = new Map();
  const pairBalances = new Map();
  const netBalances = new Map();

  const registerUser = (participant) => {
    userMap.set(participant.userId, participant);
    if (!netBalances.has(participant.userId)) {
      netBalances.set(participant.userId, 0);
    }
  };

  const adjustPairBalance = (debtorId, creditorId, amountInPaise) => {
    const key = `${debtorId}->${creditorId}`;
    pairBalances.set(key, (pairBalances.get(key) || 0) + amountInPaise);
  };

  for (const expense of expenses) {
    registerUser(expense.payer);

    for (const participant of expense.participants) {
      registerUser(participant);
    }

    for (const split of expense.splits) {
      const participantId = split.participant.userId;
      const payerId = expense.payer.userId;

      if (participantId === payerId || split.amountInPaise === 0) {
        continue;
      }

      adjustPairBalance(participantId, payerId, split.amountInPaise);
      netBalances.set(participantId, netBalances.get(participantId) - split.amountInPaise);
      netBalances.set(payerId, netBalances.get(payerId) + split.amountInPaise);
    }
  }

  return {
    userMap,
    pairBalances,
    netBalances,
  };
};

const computeRawBalances = async () => {
  const expenses = await Expense.find().sort({ createdAt: 1 });
  return computeRawBalancesFromExpenses(expenses);
};

const buildBalancesFromPairs = (userMap, pairBalances) => {
  const simplifiedBalances = [];
  const visitedPairs = new Set();

  for (const [key, amountInPaise] of pairBalances.entries()) {
    const [debtorId, creditorId] = key.split("->");
    const reverseKey = `${creditorId}->${debtorId}`;

    if (visitedPairs.has(key) || visitedPairs.has(reverseKey)) {
      continue;
    }

    const reverseAmount = pairBalances.get(reverseKey) || 0;
    const netAmount = amountInPaise - reverseAmount;

    if (netAmount > 0) {
      simplifiedBalances.push({
        from: {
          userId: debtorId,
          name: getDisplayName(userMap, debtorId),
        },
        to: {
          userId: creditorId,
          name: getDisplayName(userMap, creditorId),
        },
        amount: formatPaiseToAmount(netAmount),
        description: `${getDisplayName(userMap, debtorId)} owes ${getDisplayName(userMap, creditorId)}`,
      });
    } else if (netAmount < 0) {
      simplifiedBalances.push({
        from: {
          userId: creditorId,
          name: getDisplayName(userMap, creditorId),
        },
        to: {
          userId: debtorId,
          name: getDisplayName(userMap, debtorId),
        },
        amount: formatPaiseToAmount(Math.abs(netAmount)),
        description: `${getDisplayName(userMap, creditorId)} owes ${getDisplayName(userMap, debtorId)}`,
      });
    }

    visitedPairs.add(key);
    visitedPairs.add(reverseKey);
  }

  return simplifiedBalances.sort((left, right) => right.amount - left.amount);
};

const optimizeSettlementsFromNetBalances = (userMap, netBalances) => {
  const creditors = [];
  const debtors = [];

  for (const [userId, netAmountInPaise] of netBalances.entries()) {
    if (netAmountInPaise > 0) {
      creditors.push({ userId, amountInPaise: netAmountInPaise });
    } else if (netAmountInPaise < 0) {
      debtors.push({ userId, amountInPaise: Math.abs(netAmountInPaise) });
    }
  }

  creditors.sort((left, right) => right.amountInPaise - left.amountInPaise);
  debtors.sort((left, right) => right.amountInPaise - left.amountInPaise);

  const settlements = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const settledAmount = Math.min(creditor.amountInPaise, debtor.amountInPaise);

    settlements.push({
      from: {
        userId: debtor.userId,
        name: getDisplayName(userMap, debtor.userId),
      },
      to: {
        userId: creditor.userId,
        name: getDisplayName(userMap, creditor.userId),
      },
      amount: formatPaiseToAmount(settledAmount),
      description: `${getDisplayName(userMap, debtor.userId)} pays ${getDisplayName(
        userMap,
        creditor.userId
      )}`,
    });

    creditor.amountInPaise -= settledAmount;
    debtor.amountInPaise -= settledAmount;

    if (creditor.amountInPaise === 0) {
      creditorIndex += 1;
    }

    if (debtor.amountInPaise === 0) {
      debtorIndex += 1;
    }
  }

  return settlements;
};

const getBalances = async () => {
  const { userMap, pairBalances } = await computeRawBalances();
  return buildBalancesFromPairs(userMap, pairBalances);
};

const getOptimizedSettlements = async () => {
  const { userMap, netBalances } = await computeRawBalances();
  return optimizeSettlementsFromNetBalances(userMap, netBalances);
};

module.exports = {
  getBalances,
  getOptimizedSettlements,
  computeRawBalancesFromExpenses,
  buildBalancesFromPairs,
  optimizeSettlementsFromNetBalances,
};
