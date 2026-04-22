const mongoose = require("mongoose");

const connectDatabase = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(mongoUri);
};

module.exports = connectDatabase;
