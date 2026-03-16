const Ticket = require("../models/Ticket");

const createTicket = async ({ user_id, title, message, status }) => {
  if (!user_id || !title || !message) {
    return { status: 400, body: { message: "user_id, title, message are required" } };
  }

  const ticket = await Ticket.create({ user_id, title, message, status: status || "open" });
  return { status: 201, body: ticket };
};

const getTicketsByUser = async (userId) => {
  const tickets = await Ticket.find({ user_id: userId }).sort({ createdAt: -1 });
  return { status: 200, body: tickets };
};

module.exports = {
  createTicket,
  getTicketsByUser
};
