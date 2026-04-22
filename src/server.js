const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const connectDatabase = require("./config/database");

const port = Number(process.env.PORT) || 5000;

const startServer = async () => {
  await connectDatabase(process.env.MONGODB_URI);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
