const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cart_db";
    await mongoose.connect(uri);
    console.log("Cart DB connected");
  } catch (error) {
    console.error("Cart DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
