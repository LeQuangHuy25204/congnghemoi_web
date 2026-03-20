require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/img", express.static(path.join(__dirname, "../../public/img")));

app.get("/health", (req, res) => {
  res.status(200).json({ service: "product-service", status: "ok" });
});

app.use("/api", productRoutes);

const PORT = process.env.PORT || 5002;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Product Service running on port ${PORT}`);
  });
});
