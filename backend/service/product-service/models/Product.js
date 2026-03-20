const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
