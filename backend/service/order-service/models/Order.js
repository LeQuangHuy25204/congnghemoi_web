const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true },
    product_name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    customer_name: { type: String, default: "" },
    customer_email: { type: String, default: "" },
    items: { type: [itemSchema], required: true },
    total_price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "shipping", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
