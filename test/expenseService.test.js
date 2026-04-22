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

test("payer must be included in participants", () => {
  assert.throws(
    () =>
      expenseService.validateExpensePayload({
        title: "Lunch",
        amount: "45",
        splitType: "equal",
        payer: { userId: "u9", name: "Kiran" },
        participants: [
          { userId: "u1", name: "Aisha" },
          { userId: "u2", name: "Rahul" },
        ],
      }),
    /payer must be included/
  );
});

test("participants must be unique", () => {
  assert.throws(
    () =>
      expenseService.validateExpensePayload({
        title: "Groceries",
        amount: "80",
        splitType: "equal",
        payer: { userId: "u1", name: "Aisha" },
        participants: [
          { userId: "u1", name: "Aisha" },
          { userId: "u1", name: "Aisha" },
        ],
      }),
    /Duplicate participant/
  );
});

test("unequal split requires an amount for every participant", () => {
  assert.throws(
    () =>
      expenseService.validateExpensePayload({
        title: "Stay",
        amount: "150",
        splitType: "unequal",
        payer: { userId: "u1", name: "Aisha" },
        participants: [
          { userId: "u1", name: "Aisha" },
          { userId: "u2", name: "Rahul" },
          { userId: "u3", name: "Meera" },
        ],
        splits: [
          {
            participant: { userId: "u1", name: "Aisha" },
            amount: "50",
          },
          {
            participant: { userId: "u2", name: "Rahul" },
            amount: "50",
          },
        ],
      }),
    /must include an amount for every participant/
  );
});
