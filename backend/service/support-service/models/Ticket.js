const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "pending", "resolved", "closed"],
      default: "open",
      index: true
    },
    assigned_staff_id: { type: String, default: null, index: true },
    last_message_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
