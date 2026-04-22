const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const expenseRoutes = require("./routes/expenseRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const clientDistPath = path.join(__dirname, "..", "client-dist");
const hasClientBuild = fs.existsSync(clientDistPath);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

if (hasClientBuild) {
  app.use(express.static(clientDistPath));
}

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

  if (hasClientBuild) {
    return res.sendFile(path.join(clientDistPath, "index.html"));
  }

  return res.status(503).json({
    success: false,
    message: "Frontend build not found. Run `npm run dev` or `npm run build` first.",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
