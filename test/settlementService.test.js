const test = require("node:test");
const assert = require("node:assert/strict");

const settlementService = require("../src/services/settlementService");

test("optimized settlements reduce balances to minimal transfers", async () => {
  const { userMap, netBalances } = settlementService.computeRawBalancesFromExpenses([
    {
      payer: { userId: "u1", name: "Aman" },
      participants: [
        { userId: "u1", name: "Aman" },
        { userId: "u2", name: "Bhavna" },
        { userId: "u3", name: "Charu" },
      ],
      splits: [
        { participant: { userId: "u1", name: "Aman" }, amountInPaise: 3000 },
        { participant: { userId: "u2", name: "Bhavna" }, amountInPaise: 3000 },
        { participant: { userId: "u3", name: "Charu" }, amountInPaise: 3000 },
      ],
    },
    {
      payer: { userId: "u2", name: "Bhavna" },
      participants: [
        { userId: "u1", name: "Aman" },
        { userId: "u2", name: "Bhavna" },
      ],
      splits: [
        { participant: { userId: "u1", name: "Aman" }, amountInPaise: 2500 },
        { participant: { userId: "u2", name: "Bhavna" }, amountInPaise: 2500 },
      ],
    },
  ]);

  const settlements = settlementService.optimizeSettlementsFromNetBalances(userMap, netBalances);

  assert.deepEqual(settlements, [
    {
      from: { userId: "u3", name: "Charu" },
      to: { userId: "u1", name: "Aman" },
      amount: 30,
      description: "Charu pays Aman",
    },
    {
      from: { userId: "u2", name: "Bhavna" },
      to: { userId: "u1", name: "Aman" },
      amount: 5,
      description: "Bhavna pays Aman",
    },
  ]);
});

test("balances are simplified across reverse debtor-creditor pairs", () => {
  const { userMap, pairBalances } = settlementService.computeRawBalancesFromExpenses([
    {
      payer: { userId: "u1", name: "Aman" },
      participants: [
        { userId: "u1", name: "Aman" },
        { userId: "u2", name: "Bhavna" },
      ],
      splits: [
        { participant: { userId: "u1", name: "Aman" }, amountInPaise: 4000 },
        { participant: { userId: "u2", name: "Bhavna" }, amountInPaise: 4000 },
      ],
    },
    {
      payer: { userId: "u2", name: "Bhavna" },
      participants: [
        { userId: "u1", name: "Aman" },
        { userId: "u2", name: "Bhavna" },
      ],
      splits: [
        { participant: { userId: "u1", name: "Aman" }, amountInPaise: 1500 },
        { participant: { userId: "u2", name: "Bhavna" }, amountInPaise: 1500 },
      ],
    },
  ]);

  const balances = settlementService.buildBalancesFromPairs(userMap, pairBalances);

  assert.deepEqual(balances, [
    {
      from: { userId: "u2", name: "Bhavna" },
      to: { userId: "u1", name: "Aman" },
      amount: 25,
      description: "Bhavna owes Aman",
    },
  ]);
});
