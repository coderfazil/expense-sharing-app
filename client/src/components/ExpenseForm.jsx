import { useEffect, useState } from "react";

const defaultParticipants = [
  { userId: "u1", name: "Aisha" },
  { userId: "u2", name: "Rahul" },
];

const createEmptyParticipant = () => ({
  userId: "",
  name: "",
});

const createDefaultFormState = () => ({
  title: "",
  description: "",
  amount: "",
  splitType: "equal",
  payer: { ...defaultParticipants[0] },
  participants: defaultParticipants.map((participant) => ({ ...participant })),
  splitAmounts: Object.fromEntries(defaultParticipants.map((participant) => [participant.userId, ""])),
});

const ExpenseForm = ({ onSubmit, submitting }) => {
  const [formState, setFormState] = useState(createDefaultFormState);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setFormState((currentState) => {
      const validParticipants = currentState.participants.filter(
        (participant) => participant.userId.trim() && participant.name.trim()
      );
      const firstParticipant = validParticipants[0];

      if (!firstParticipant) {
        return currentState;
      }

      if (currentState.payer.userId && currentState.payer.name) {
        return currentState;
      }

      return {
        ...currentState,
        payer: { ...firstParticipant },
      };
    });
  }, [formState.participants]);

  const updateField = (field, value) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  };

  const updatePayerField = (field, value) => {
    setFormState((currentState) => ({
      ...currentState,
      payer: {
        ...currentState.payer,
        [field]: value,
      },
    }));
  };

  const updateParticipant = (index, field, value) => {
    setFormState((currentState) => {
      const nextParticipants = currentState.participants.map((participant, participantIndex) =>
        participantIndex === index ? { ...participant, [field]: value } : participant
      );

      const nextSplitAmounts = { ...currentState.splitAmounts };
      const previousUserId = currentState.participants[index]?.userId;

      if (field === "userId" && previousUserId !== value) {
        const carriedAmount = nextSplitAmounts[previousUserId] || "";
        delete nextSplitAmounts[previousUserId];
        nextSplitAmounts[value] = carriedAmount;
      }

      return {
        ...currentState,
        participants: nextParticipants,
        splitAmounts: nextSplitAmounts,
      };
    });
  };

  const addParticipant = () => {
    setFormState((currentState) => ({
      ...currentState,
      participants: [...currentState.participants, createEmptyParticipant()],
    }));
  };

  const removeParticipant = (index) => {
    setFormState((currentState) => {
      const participantToRemove = currentState.participants[index];
      const nextParticipants = currentState.participants.filter(
        (_, participantIndex) => participantIndex !== index
      );
      const nextSplitAmounts = { ...currentState.splitAmounts };

      delete nextSplitAmounts[participantToRemove.userId];

      return {
        ...currentState,
        participants: nextParticipants,
        splitAmounts: nextSplitAmounts,
      };
    });
  };

  const updateSplitAmount = (userId, amount) => {
    setFormState((currentState) => ({
      ...currentState,
      splitAmounts: {
        ...currentState.splitAmounts,
        [userId]: amount,
      },
    }));
  };

  const resetForm = () => {
    setFormState(createDefaultFormState());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    const participants = formState.participants.map((participant) => ({
      userId: participant.userId.trim(),
      name: participant.name.trim(),
    }));

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      amount: formState.amount,
      splitType: formState.splitType,
      payer: {
        userId: formState.payer.userId.trim(),
        name: formState.payer.name.trim(),
      },
      participants,
    };

    if (formState.splitType === "unequal") {
      payload.splits = participants.map((participant) => ({
        participant,
        amount: formState.splitAmounts[participant.userId] || "",
      }));
    }

    try {
      await onSubmit(payload);
      resetForm();
      setMessage({ type: "success", text: "Expense created successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const activeParticipants = formState.participants.filter(
    (participant) => participant.userId.trim() && participant.name.trim()
  );

  return (
    <section className="panel form-panel">
      <div className="panel-heading">
        <p className="eyebrow">Smart Expense Sharing</p>
        <h1>Track shared expenses.</h1>
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <label>
          <span>Expense title</span>
          <input
            type="text"
            value={formState.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Dinner, cab, groceries"
            required
          />
        </label>

        <label>
          <span>Description</span>
          <input
            type="text"
            value={formState.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Optional note"
          />
        </label>

        <div className="grid two-col">
          <label>
            <span>Total amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formState.amount}
              onChange={(event) => updateField("amount", event.target.value)}
              required
            />
          </label>

          <label>
            <span>Split type</span>
            <select
              value={formState.splitType}
              onChange={(event) => updateField("splitType", event.target.value)}
            >
              <option value="equal">Equal</option>
              <option value="unequal">Unequal</option>
            </select>
          </label>
        </div>

        <section className="subsection">
          <div className="subsection-header">
            <h2>Participants</h2>
            <button type="button" className="secondary-btn" onClick={addParticipant}>
              Add participant
            </button>
          </div>

          <div className="stack">
            {formState.participants.map((participant, index) => (
              <div className="row participant-row" key={`${index}-${participant.userId || "new"}`}>
                <label>
                  <span>User ID</span>
                  <input
                    type="text"
                    value={participant.userId}
                    onChange={(event) => updateParticipant(index, "userId", event.target.value)}
                    placeholder="u1"
                    required
                  />
                </label>

                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    value={participant.name}
                    onChange={(event) => updateParticipant(index, "name", event.target.value)}
                    placeholder="Aisha"
                    required
                  />
                </label>

                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => removeParticipant(index)}
                  disabled={formState.participants.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="subsection">
          <div className="subsection-header">
            <h2>Payer</h2>
          </div>

          <div className="grid two-col">
            <label>
              <span>Payer userId</span>
              <input
                type="text"
                value={formState.payer.userId}
                onChange={(event) => updatePayerField("userId", event.target.value)}
                placeholder="e.g. u1"
                required
              />
            </label>

            <label>
              <span>Payer name</span>
              <input
                type="text"
                value={formState.payer.name}
                onChange={(event) => updatePayerField("name", event.target.value)}
                placeholder="e.g. Aisha"
                required
              />
            </label>
          </div>
        </section>

        {formState.splitType === "unequal" ? (
          <section className="subsection">
            <div className="subsection-header">
              <h2>Unequal splits</h2>
              <p>Enter one amount per participant. Total must match exactly.</p>
            </div>

            <div className="stack">
              {activeParticipants.map((participant) => (
                <div className="row split-row" key={participant.userId}>
                  <label>
                    <span>User ID</span>
                    <input type="text" value={participant.userId} readOnly />
                  </label>
                  <label>
                    <span>Name</span>
                    <input type="text" value={participant.name} readOnly />
                  </label>
                  <label>
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.splitAmounts[participant.userId] || ""}
                      onChange={(event) => updateSplitAmount(participant.userId, event.target.value)}
                      required
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? "Saving..." : "Create expense"}
        </button>
        <p className={`form-message ${message.type}`.trim()}>{message.text}</p>
      </form>
    </section>
  );
};

export default ExpenseForm;
