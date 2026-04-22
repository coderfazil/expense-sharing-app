const Expense = require("../models/expenseModel");
const ApiError = require("../utils/ApiError");
const { parseAmountToPaise, formatPaiseToAmount } = require("../utils/money");

const normalizeParticipant = (participant, fieldName) => {
  if (!participant || typeof participant !== "object") {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const userId = String(participant.userId || "").trim();
  const name = String(participant.name || "").trim();

  if (!userId || !name) {
    throw new ApiError(400, `${fieldName} must include userId and name`);
  }

  return { userId, name };
};

const deduplicateParticipants = (participants) => {
  const seenUserIds = new Set();

  return participants.map((participant, index) => {
    const normalizedParticipant = normalizeParticipant(
      participant,
      `participants[${index}]`
    );

    if (seenUserIds.has(normalizedParticipant.userId)) {
      throw new ApiError(400, `Duplicate participant found: ${normalizedParticipant.userId}`);
    }

    seenUserIds.add(normalizedParticipant.userId);
    return normalizedParticipant;
  });
};

const buildEqualSplits = (participants, totalAmountInPaise) => {
  const baseShare = Math.floor(totalAmountInPaise / participants.length);
  const remainder = totalAmountInPaise % participants.length;

  return participants.map((participant, index) => ({
    participant,
    amountInPaise: baseShare + (index < remainder ? 1 : 0),
  }));
};

const buildUnequalSplits = (participants, rawSplits, totalAmountInPaise) => {
  if (!Array.isArray(rawSplits) || rawSplits.length !== participants.length) {
    throw new ApiError(400, "Unequal split must include an amount for every participant");
  }

  const participantMap = new Map(participants.map((participant) => [participant.userId, participant]));
  const seenUserIds = new Set();

  const splits = rawSplits.map((split, index) => {
    const participant = normalizeParticipant(split.participant, `splits[${index}].participant`);
    const matchingParticipant = participantMap.get(participant.userId);

    if (!matchingParticipant) {
      throw new ApiError(400, `Split participant ${participant.userId} is not part of the expense`);
    }

    if (seenUserIds.has(participant.userId)) {
      throw new ApiError(400, `Duplicate split found for participant ${participant.userId}`);
    }

    seenUserIds.add(participant.userId);

    return {
      participant: matchingParticipant,
      amountInPaise: parseAmountToPaise(split.amount, `splits[${index}].amount`),
    };
  });

  const splitTotal = splits.reduce((sum, split) => sum + split.amountInPaise, 0);

  if (splitTotal !== totalAmountInPaise) {
    throw new ApiError(400, "Unequal split total must exactly match the expense amount");
  }

  return splits;
};

const validateExpensePayload = (payload) => {
  const title = String(payload.title || "").trim();

  if (!title) {
    throw new ApiError(400, "title is required");
  }

  const amountInPaise = parseAmountToPaise(payload.amount, "amount");
  const splitType = String(payload.splitType || "").trim().toLowerCase();

  if (!["equal", "unequal"].includes(splitType)) {
    throw new ApiError(400, "splitType must be either equal or unequal");
  }

  if (!Array.isArray(payload.participants) || payload.participants.length === 0) {
    throw new ApiError(400, "participants are required");
  }

  const payer = normalizeParticipant(payload.payer, "payer");
  const participants = deduplicateParticipants(payload.participants);

  if (!participants.some((participant) => participant.userId === payer.userId)) {
    throw new ApiError(400, "payer must be included in participants");
  }

  const splits =
    splitType === "equal"
      ? buildEqualSplits(participants, amountInPaise)
      : buildUnequalSplits(participants, payload.splits, amountInPaise);

  return {
    title,
    description: String(payload.description || "").trim(),
    amountInPaise,
    splitType,
    payer,
    participants,
    splits,
  };
};

const serializeExpense = (expenseDocument) => ({
  id: expenseDocument._id.toString(),
  title: expenseDocument.title,
  description: expenseDocument.description,
  amount: formatPaiseToAmount(expenseDocument.amountInPaise),
  splitType: expenseDocument.splitType,
  payer: expenseDocument.payer,
  participants: expenseDocument.participants,
  splits: expenseDocument.splits.map((split) => ({
    participant: split.participant,
    amount: formatPaiseToAmount(split.amountInPaise),
  })),
  createdAt: expenseDocument.createdAt,
  updatedAt: expenseDocument.updatedAt,
});

const createExpense = async (payload) => {
  const validatedExpense = validateExpensePayload(payload);
  const expense = await Expense.create(validatedExpense);
  return serializeExpense(expense);
};

const getAllExpenses = async () => {
  const expenses = await Expense.find().sort({ createdAt: -1 });
  return expenses.map(serializeExpense);
};

const deleteExpense = async (expenseId) => {
  const deletedExpense = await Expense.findByIdAndDelete(expenseId);

  if (!deletedExpense) {
    throw new ApiError(404, "Expense not found");
  }
};

module.exports = {
  createExpense,
  getAllExpenses,
  deleteExpense,
  serializeExpense,
  validateExpensePayload,
};
