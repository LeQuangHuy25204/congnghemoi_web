const mongoose = require("mongoose");

const supportHistorySchema = new mongoose.Schema(
  {
    ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    action: { type: String, required: true, index: true },
    actor_id: { type: String, default: null },
    actor_role: { type: String, enum: ["customer", "employee", "system"], default: "system" },
    note: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportHistory", supportHistorySchema);
