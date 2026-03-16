const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/payment_db";
    await mongoose.connect(uri);
    console.log("Payment DB connected");
  } catch (error) {
    console.error("Payment DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
