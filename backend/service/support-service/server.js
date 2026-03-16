require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const supportRoutes = require("./routes/supportRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ service: "support-service", status: "ok" });
});

app.use("/api/support", supportRoutes);

const PORT = process.env.PORT || 5007;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Support Service running on port ${PORT}`);
  });
});
