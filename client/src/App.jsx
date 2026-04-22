import { useEffect, useState } from "react";
import {
  createExpense,
  deleteExpense,
  fetchBalances,
  fetchExpenses,
  fetchSettlements,
} from "./api";
import ExpenseForm from "./components/ExpenseForm";
import DashboardSection from "./components/DashboardSection";

const money = (value) => `Rs. ${Number(value).toFixed(2)}`;

const App = () => {
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [expensesResponse, balancesResponse, settlementsResponse] = await Promise.all([
        fetchExpenses(),
        fetchBalances(),
        fetchSettlements(),
      ]);

      setExpenses(expensesResponse.data);
      setBalances(balancesResponse.data);
      setSettlements(settlementsResponse.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateExpense = async (payload) => {
    setSubmitting(true);

    try {
      await createExpense(payload);
      await loadDashboard();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await deleteExpense(expenseId);
      await loadDashboard();
    } catch (requestError) {
      window.alert(requestError.message);
    }
  };

  return (
    <main className="layout">
      <ExpenseForm onSubmit={handleCreateExpense} submitting={submitting} />

      <section className="panel data-panel">
        <div className="toolbar">
          <div>
            <p className="eyebrow">Live summary</p>
            <h2 className="toolbar-title">Expense dashboard</h2>
          </div>
          <button type="button" className="secondary-btn" onClick={loadDashboard}>
            Refresh data
          </button>
        </div>

        {error ? <p className="banner error-banner">{error}</p> : null}
        {loading ? <p className="banner">Loading dashboard...</p> : null}

        <DashboardSection
          title="Expenses"
          emptyMessage="No expenses added yet."
          items={expenses}
          renderItem={(expense) => (
            <article className="card" key={expense.id}>
              <div className="expense-card-header">
                <div>
                  <h3>{expense.title}</h3>
                  <p className="meta">{expense.description || "No description"}</p>
                </div>
                <span className="tag">{expense.splitType}</span>
              </div>

              <p className="meta">
                {expense.payer.name} paid {money(expense.amount)}
              </p>

              <div className="inline-list">
                {expense.splits.map((split) => (
                  <span className="tag" key={`${expense.id}-${split.participant.userId}`}>
                    {split.participant.name}: {money(split.amount)}
                  </span>
                ))}
              </div>

              <button
                type="button"
                className="danger-btn card-action"
                onClick={() => handleDeleteExpense(expense.id)}
              >
                Delete
              </button>
            </article>
          )}
        />

        <DashboardSection
          title="Balances"
          emptyMessage="No balances to show."
          items={balances}
          renderItem={(balance) => (
            <article className="card" key={`${balance.from.userId}-${balance.to.userId}`}>
              <strong>{balance.description}</strong>
              <p className="meta">{money(balance.amount)}</p>
            </article>
          )}
        />

        <DashboardSection
          title="Optimized settlements"
          emptyMessage="No settlements required."
          items={settlements}
          renderItem={(settlement) => (
            <article className="card" key={`${settlement.from.userId}-${settlement.to.userId}`}>
              <strong>{settlement.description}</strong>
              <p className="meta">{money(settlement.amount)}</p>
            </article>
          )}
        />
      </section>
    </main>
  );
};

export default App;
