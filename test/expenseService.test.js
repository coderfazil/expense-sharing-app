const test = require("node:test");
const assert = require("node:assert/strict");

const expenseService = require("../src/services/expenseService");

test("equal split distributes remainder without losing precision", () => {
  const expense = expenseService.validateExpensePayload({
    title: "Snacks",
    amount: "100",
    splitType: "equal",
    payer: { userId: "u1", name: "Aisha" },
    participants: [
      { userId: "u1", name: "Aisha" },
      { userId: "u2", name: "Rahul" },
      { userId: "u3", name: "Meera" },
    ],
  });

  assert.equal(expense.amountInPaise, 10000);
  assert.deepEqual(
    expense.splits.map((split) => split.amountInPaise),
    [3334, 3333, 3333]
  );
});

test("unequal split rejects totals that do not match the expense amount", () => {
  assert.throws(
    () =>
      expenseService.validateExpensePayload({
        title: "Taxi",
        amount: "90",
        splitType: "unequal",
        payer: { userId: "u1", name: "Aisha" },
        participants: [
          { userId: "u1", name: "Aisha" },
          { userId: "u2", name: "Rahul" },
        ],
        splits: [
          {
            participant: { userId: "u1", name: "Aisha" },
            amount: "30",
          },
          {
            participant: { userId: "u2", name: "Rahul" },
            amount: "20",
          },
        ],
      }),
    /must exactly match/
  );
});
