const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/auth_db";
    await mongoose.connect(uri);
    console.log("Auth DB connected");
  } catch (error) {
    console.error("Auth DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
