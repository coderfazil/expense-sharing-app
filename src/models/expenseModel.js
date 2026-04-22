const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const splitSchema = new mongoose.Schema(
  {
    participant: {
      type: participantSchema,
      required: true,
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 1,
    },
    splitType: {
      type: String,
      enum: ["equal", "unequal"],
      required: true,
    },
    payer: {
      type: participantSchema,
      required: true,
    },
    participants: {
      type: [participantSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one participant is required",
      },
    },
    splits: {
      type: [splitSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Expense splits are required",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);
