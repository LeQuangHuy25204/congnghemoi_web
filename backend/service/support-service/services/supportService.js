const Ticket = require("../models/Ticket");
const SupportMessage = require("../models/SupportMessage");
const SupportHistory = require("../models/SupportHistory");

const ALLOWED_STATUSES = ["open", "pending", "resolved", "closed"];

const createHistory = async ({ ticket_id, action, actor_id, actor_role, note, meta }) =>
  SupportHistory.create({
    ticket_id,
    action,
    actor_id: actor_id || null,
    actor_role: actor_role || "system",
    note: note || "",
    meta: meta || {}
  });

const createTicket = async ({ user_id, title, message, status, actor_id, actor_role }) => {
  if (!user_id || !title || !message) {
    return { status: 400, body: { message: "user_id, title, message are required" } };
  }

  const normalizedStatus = status && ALLOWED_STATUSES.includes(status) ? status : "open";

  const ticket = await Ticket.create({
    user_id,
    title,
    message,
    status: normalizedStatus,
    last_message_at: new Date()
  });

  await createHistory({
    ticket_id: ticket._id,
    action: "created",
    actor_id: actor_id || user_id,
    actor_role: actor_role || "customer",
    note: message,
    meta: { title }
  });

  return { status: 201, body: ticket };
};

const getTicketsByUser = async (userId) => {
  const tickets = await Ticket.find({ user_id: userId }).sort({ createdAt: -1 });
  return { status: 200, body: tickets };
};

const getAllTickets = async () => {
  const tickets = await Ticket.find({}).sort({ createdAt: -1 });
  return { status: 200, body: tickets };
};

const getTicketById = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return { status: 404, body: { message: "Ticket not found" } };
  }
  return { status: 200, body: ticket };
};

const updateTicketStatus = async ({ ticket_id, status, actor_id, actor_role }) => {
  if (!ticket_id || !status) {
    return { status: 400, body: { message: "ticket_id and status are required" } };
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return { status: 400, body: { message: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` } };
  }

  const ticket = await Ticket.findById(ticket_id);
  if (!ticket) {
    return { status: 404, body: { message: "Ticket not found" } };
  }

  const previousStatus = ticket.status;
  ticket.status = status;
  await ticket.save();

  await createHistory({
    ticket_id,
    action: "status_updated",
    actor_id,
    actor_role: actor_role || "employee",
    note: `Status changed from ${previousStatus} to ${status}`,
    meta: { from: previousStatus, to: status }
  });

  return { status: 200, body: ticket };
};

const assignTicket = async ({ ticket_id, staff_id, actor_id, actor_role }) => {
  if (!ticket_id || !staff_id) {
    return { status: 400, body: { message: "ticket_id and staff_id are required" } };
  }

  const ticket = await Ticket.findById(ticket_id);
  if (!ticket) {
    return { status: 404, body: { message: "Ticket not found" } };
  }

  const previousAssignee = ticket.assigned_staff_id;
  ticket.assigned_staff_id = staff_id;
  await ticket.save();

  await createHistory({
    ticket_id,
    action: "assigned",
    actor_id,
    actor_role: actor_role || "employee",
    note: `Assigned to staff ${staff_id}`,
    meta: { from: previousAssignee, to: staff_id }
  });

  return { status: 200, body: ticket };
};

const sendMessage = async ({ ticket_id, sender_id, sender_role, content }) => {
  if (!ticket_id || !sender_id || !sender_role || !content) {
    return {
      status: 400,
      body: { message: "ticket_id, sender_id, sender_role, content are required" }
    };
  }
  if (!["customer", "employee", "system"].includes(sender_role)) {
    return { status: 400, body: { message: "sender_role must be customer, employee, or system" } };
  }

  const ticket = await Ticket.findById(ticket_id);
  if (!ticket) {
    return { status: 404, body: { message: "Ticket not found" } };
  }

  const message = await SupportMessage.create({
    ticket_id,
    sender_id,
    sender_role,
    content
  });

  ticket.last_message_at = new Date();
  await ticket.save();

  await createHistory({
    ticket_id,
    action: "message",
    actor_id: sender_id,
    actor_role: sender_role,
    note: content
  });

  return { status: 201, body: message };
};

const getMessages = async (ticketId) => {
  const messages = await SupportMessage.find({ ticket_id: ticketId }).sort({ createdAt: 1 });
  return { status: 200, body: messages };
};

const getHistory = async (ticketId) => {
  const history = await SupportHistory.find({ ticket_id: ticketId }).sort({ createdAt: 1 });
  return { status: 200, body: history };
};

module.exports = {
  createTicket,
  getTicketsByUser,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  sendMessage,
  getMessages,
  getHistory
};
