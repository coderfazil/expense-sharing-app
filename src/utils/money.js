const ApiError = require("./ApiError");

const PAISE_IN_RUPEE = 100;

const parseAmountToPaise = (value, fieldName = "amount") => {
  if (value === undefined || value === null || value === "") {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const normalizedValue =
    typeof value === "number" ? value.toFixed(2) : String(value).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw new ApiError(400, `${fieldName} must be a valid amount with up to 2 decimals`);
  }

  const [wholePart, decimalPart = ""] = normalizedValue.split(".");
  const paise = Number(wholePart) * PAISE_IN_RUPEE + Number(decimalPart.padEnd(2, "0"));

  if (!Number.isSafeInteger(paise) || paise <= 0) {
    throw new ApiError(400, `${fieldName} must be greater than 0`);
  }

  return paise;
};

const formatPaiseToAmount = (paise) => Number((paise / PAISE_IN_RUPEE).toFixed(2));

module.exports = {
  parseAmountToPaise,
  formatPaiseToAmount,
};
