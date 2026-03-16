const asyncHandler = require('../../shared/utils/asyncHandler');
const ticketService = require('../services/ticketService');

const listTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.listTickets(req.query);
  res.json(result);
});

const getTicket = asyncHandler(async (req, res) => {
  const result = await ticketService.getTicket(req.params.ticketId);
  res.json(result);
});

const createTicket = asyncHandler(async (req, res) => {
  const result = await ticketService.createTicket(req.body);
  res.status(201).json(result);
});

const updateStatus = asyncHandler(async (req, res) => {
  const result = await ticketService.updateStatus(req.params.ticketId, req.body);
  res.json(result);
});

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  updateStatus,
};
