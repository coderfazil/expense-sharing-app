const parseResponse = async (response) => {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || "Request failed");
  }

  return body;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  return parseResponse(response);
};

export const fetchExpenses = async () => request("/api/expenses");
export const fetchBalances = async () => request("/api/expenses/balances");
export const fetchSettlements = async () => request("/api/expenses/settlements");

export const createExpense = async (payload) =>
  request("/api/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const deleteExpense = async (expenseId) =>
  request(`/api/expenses/${expenseId}`, {
    method: "DELETE",
  });
