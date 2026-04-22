const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const expenseRoutes = require("./routes/expenseRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Expense sharing API is running",
  });
});

app.use("/api/expenses", expenseRoutes);

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }

  return res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
