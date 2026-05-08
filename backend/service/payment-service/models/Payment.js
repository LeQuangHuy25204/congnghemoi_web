const mongoose = require("mongoose");

const PAYMENT_METHODS = ["cod", "bank", "momo", "payos", "sepay", "vietqr"];
const PAYMENT_PROVIDERS = ["cod", "payos", "sepay", "vietqr", "manual"];
const PAYMENT_STATUSES = ["pending", "processing", "paid", "failed", "cancelled", "expired", "refunded"];

const paymentSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    provider: { type: String, enum: PAYMENT_PROVIDERS, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: "pending", index: true },
    description: { type: String, default: "" },
    order_code: { type: Number, sparse: true, index: true },
    payment_link_id: { type: String, default: "", index: true },
    checkout_url: { type: String, default: "" },
    qr_code: { type: String, default: "" },
    qr_data_url: { type: String, default: "" },
    qr_image_url: { type: String, default: "" },
    account_name: { type: String, default: "" },
    account_no: { type: String, default: "" },
    acq_id: { type: String, default: "" },
    paid_amount: { type: Number, default: 0, min: 0 },
    paid_at: { type: Date, default: null },
    transaction_id: { type: String, default: "", index: true },
    bank_transaction_id: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    payos_data: { type: mongoose.Schema.Types.Mixed, default: {} },
    vietqr_data: { type: mongoose.Schema.Types.Mixed, default: {} },
    payment_result: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

paymentSchema.index({ order_id: 1, user_id: 1 }, { unique: true });

module.exports = {
  Payment: mongoose.model("Payment", paymentSchema),
  PAYMENT_METHODS,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES
};
