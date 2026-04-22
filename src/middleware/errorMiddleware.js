const notFoundHandler = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = error.message || "Something went wrong";

  if (error.name === "ValidationError") {
    statusCode = 400;
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
