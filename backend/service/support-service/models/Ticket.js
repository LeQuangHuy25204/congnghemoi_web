const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: "open" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
