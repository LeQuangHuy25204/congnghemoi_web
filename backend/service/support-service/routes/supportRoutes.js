const express = require("express");
const { createTicket, getTicketsByUser } = require("../controllers/supportController");

const router = express.Router();

router.post("/ticket", createTicket);
router.get("/tickets/:user_id", getTicketsByUser);

module.exports = router;
