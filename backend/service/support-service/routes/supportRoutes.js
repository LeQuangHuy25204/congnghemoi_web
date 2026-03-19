const express = require("express");
const {
  createTicket,
  getTicketsByUser,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  sendMessage,
  getMessages,
  getHistory
} = require("../controllers/supportController");

const router = express.Router();

router.post("/ticket", createTicket);
router.get("/tickets/:user_id", getTicketsByUser);
router.get("/tickets", getAllTickets);
router.get("/ticket/:ticket_id", getTicketById);
router.patch("/ticket/:ticket_id/status", updateTicketStatus);
router.patch("/ticket/:ticket_id/assign", assignTicket);
router.post("/ticket/:ticket_id/message", sendMessage);
router.get("/ticket/:ticket_id/messages", getMessages);
router.get("/ticket/:ticket_id/history", getHistory);

module.exports = router;
