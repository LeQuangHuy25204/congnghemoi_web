const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true },
    user_id: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true },
    status: { type: String, default: "paid" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
