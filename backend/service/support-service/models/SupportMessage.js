const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    sender_id: { type: String, required: true, index: true },
    sender_role: { type: String, enum: ["customer", "employee", "system"], required: true },
    content: { type: String, required: true },
    message_type: { type: String, enum: ["message", "system"], default: "message" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportMessage", supportMessageSchema);
