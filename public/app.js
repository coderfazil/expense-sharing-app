const expenseForm = document.getElementById("expense-form");
const participantsList = document.getElementById("participants-list");
const participantTemplate = document.getElementById("participant-template");
const splitTemplate = document.getElementById("split-template");
const splitsList = document.getElementById("splits-list");
const splitTypeSelect = document.getElementById("split-type");
const splitsSection = document.getElementById("splits-section");
const formMessage = document.getElementById("form-message");
const expensesList = document.getElementById("expenses-list");
const balancesList = document.getElementById("balances-list");
const settlementsList = document.getElementById("settlements-list");

const createParticipantRow = (participant = {}) => {
  const row = participantTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector('[data-field="userId"]').value = participant.userId || "";
  row.querySelector('[data-field="name"]').value = participant.name || "";

  row.querySelector(".remove-row-btn").addEventListener("click", () => {
    row.remove();
    syncSplitRows();
  });

  row.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", syncSplitRows);
  });

  participantsList.appendChild(row);
  syncSplitRows();
};

const getParticipants = () =>
  Array.from(participantsList.querySelectorAll(".participant-row")).map((row) => ({
    userId: row.querySelector('[data-field="userId"]').value.trim(),
    name: row.querySelector('[data-field="name"]').value.trim(),
  }));

const syncSplitRows = () => {
  const participants = getParticipants().filter((participant) => participant.userId && participant.name);
  const existingAmounts = new Map(
    Array.from(splitsList.querySelectorAll(".split-row")).map((row) => [
      row.querySelector('[data-field="userId"]').value,
      row.querySelector('[data-field="amount"]').value,
    ])
  );

  splitsList.innerHTML = "";

  participants.forEach((participant) => {
    const row = splitTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector('[data-field="userId"]').value = participant.userId;
    row.querySelector('[data-field="name"]').value = participant.name;
    row.querySelector('[data-field="amount"]').value = existingAmounts.get(participant.userId) || "";
    splitsList.appendChild(row);
  });
};

const setMessage = (message, type = "") => {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
};

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message || "Request failed");
  }

  return body;
};

const money = (value) => `Rs. ${Number(value).toFixed(2)}`;

const renderList = (container, items, emptyMessage, renderItem) => {
  if (!items.length) {
    container.className = "card-list empty-state";
    container.textContent = emptyMessage;
    return;
  }

  container.className = "card-list";
  container.innerHTML = "";
  items.forEach((item) => container.appendChild(renderItem(item)));
};

const renderExpenses = (expenses) => {
  renderList(expensesList, expenses, "No expenses added yet.", (expense) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="expense-card-header">
        <div>
          <h3>${expense.title}</h3>
          <p class="meta">${expense.description || "No description"}</p>
        </div>
        <span class="tag">${expense.splitType}</span>
      </div>
      <p class="meta">${expense.payer.name} paid ${money(expense.amount)}</p>
      <div class="inline-list">
        ${expense.splits
          .map(
            (split) =>
              `<span class="tag">${split.participant.name}: ${money(split.amount)}</span>`
          )
          .join("")}
      </div>
    `;

    const deleteButton = document.createElement("button");
    deleteButton.className = "danger-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", async () => {
      try {
        await apiRequest(`/api/expenses/${expense.id}`, { method: "DELETE" });
        await loadDashboard();
      } catch (error) {
        window.alert(error.message);
      }
    });

    card.appendChild(deleteButton);
    return card;
  });
};

const renderBalances = (balances) => {
  renderList(balancesList, balances, "No balances to show.", (balance) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<strong>${balance.description}</strong><p class="meta">${money(balance.amount)}</p>`;
    return card;
  });
};

const renderSettlements = (settlements) => {
  renderList(settlementsList, settlements, "No settlements required.", (settlement) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<strong>${settlement.description}</strong><p class="meta">${money(
      settlement.amount
    )}</p>`;
    return card;
  });
};

const loadDashboard = async () => {
  const [expensesResponse, balancesResponse, settlementsResponse] = await Promise.all([
    apiRequest("/api/expenses"),
    apiRequest("/api/expenses/balances"),
    apiRequest("/api/expenses/settlements"),
  ]);

  renderExpenses(expensesResponse.data);
  renderBalances(balancesResponse.data);
  renderSettlements(settlementsResponse.data);
};

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage("");

  const formData = new FormData(expenseForm);
  const participants = getParticipants();
  const payload = {
    title: formData.get("title"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    splitType: formData.get("splitType"),
    payer: {
      userId: formData.get("payerUserId"),
      name: formData.get("payerName"),
    },
    participants,
  };

  if (payload.splitType === "unequal") {
    payload.splits = Array.from(splitsList.querySelectorAll(".split-row")).map((row) => ({
      participant: {
        userId: row.querySelector('[data-field="userId"]').value,
        name: row.querySelector('[data-field="name"]').value,
      },
      amount: row.querySelector('[data-field="amount"]').value,
    }));
  }

  try {
    await apiRequest("/api/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expenseForm.reset();
    participantsList.innerHTML = "";
    createParticipantRow({ userId: "u1", name: "Aisha" });
    createParticipantRow({ userId: "u2", name: "Rahul" });
    splitsSection.hidden = true;
    setMessage("Expense created successfully.", "success");
    await loadDashboard();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

splitTypeSelect.addEventListener("change", (event) => {
  splitsSection.hidden = event.target.value !== "unequal";
  syncSplitRows();
});

document.getElementById("add-participant-btn").addEventListener("click", () => createParticipantRow());
document.getElementById("refresh-btn").addEventListener("click", () => loadDashboard());

createParticipantRow({ userId: "u1", name: "Aisha" });
createParticipantRow({ userId: "u2", name: "Rahul" });
loadDashboard().catch((error) => {
  setMessage(error.message, "error");
});
