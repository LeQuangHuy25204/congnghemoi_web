const mongoose = require("mongoose");

const createProductDbConnection = () => {
  const uri = process.env.PRODUCT_DB_URI || "mongodb://127.0.0.1:27017/product_db";
  return mongoose.createConnection(uri);
};

module.exports = createProductDbConnection;
