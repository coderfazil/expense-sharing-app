const asyncHandler = require("../utils/asyncHandler");
const expenseService = require("../services/expenseService");
const settlementService = require("../services/settlementService");

const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body);
  res.status(201).json({
    success: true,
    data: expense,
  });
});

const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await expenseService.getAllExpenses();
  res.json({
    success: true,
    count: expenses.length,
    data: expenses,
  });
});

const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.params.id);
  res.json({
    success: true,
    message: "Expense deleted successfully",
  });
});

const getBalances = asyncHandler(async (req, res) => {
  const balances = await settlementService.getBalances();
  res.json({
    success: true,
    count: balances.length,
    data: balances,
  });
});

const getSettlements = asyncHandler(async (req, res) => {
  const settlements = await settlementService.getOptimizedSettlements();
  res.json({
    success: true,
    count: settlements.length,
    data: settlements,
  });
});

module.exports = {
  createExpense,
  getExpenses,
  deleteExpense,
  getBalances,
  getSettlements,
};
