const express = require("express");

const expenseController = require("../controllers/expenseController");

const router = express.Router();

router.get("/balances", expenseController.getBalances);
router.get("/settlements", expenseController.getSettlements);
router.get("/", expenseController.getExpenses);
router.post("/", expenseController.createExpense);
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
