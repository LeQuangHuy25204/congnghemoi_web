const mongoose = require("mongoose");

const chatLogSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    intent: { type: String, default: "unknown" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatLog", chatLogSchema);
