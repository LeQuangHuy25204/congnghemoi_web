const Ticket = require('../models/Ticket');
const AppError = require('../../shared/utils/appError');

const listTickets = async ({ userId, status }) => {
  const query = {};
  if (userId) query.userId = userId;
  if (status) query.status = status;

  const tickets = await Ticket.find(query).sort({ createdAt: -1 });
  return { items: tickets };
};

const getTicket = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }
  return { item: ticket };
};

const createTicket = async ({ userId, subject, message }) => {
  if (!userId || !subject || !message) {
    throw new AppError('User, subject and message are required', 400);
  }

  const ticket = await Ticket.create({ userId, subject, message });
  return { item: ticket };
};

const updateStatus = async (ticketId, { status }) => {
  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const ticket = await Ticket.findByIdAndUpdate(ticketId, { status }, { new: true });
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  return { item: ticket };
};

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  updateStatus,
};
