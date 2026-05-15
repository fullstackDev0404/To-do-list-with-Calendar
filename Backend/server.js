require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth");
const todoRoutes = require("./src/routes/todos");

const app = express();

// Validate required environment variables before connecting to DB
const REQUIRED_ENV_VARS = ["MONGODB_URI", "CLIENT_URL", "JWT_SECRET"];
const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  missingVars.forEach((v) => {
    console.error(`[ERROR] Missing required environment variable: ${v}`);
  });
  process.exit(1);
}

connectDB();

const corsOrigin = process.env.CLIENT_URL || "http://localhost:3000";
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use("/api/auth",authRoutes);
app.use("/api/todos",todoRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT,()=>{

  console.log(`Server running on port ${PORT}`);

});