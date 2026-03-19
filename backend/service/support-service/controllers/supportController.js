const supportService = require("../services/supportService");

exports.createTicket = async (req, res) => {
  try {
    const result = await supportService.createTicket(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Create ticket failed", error: error.message });
  }
};

exports.getTicketsByUser = async (req, res) => {
  try {
    const result = await supportService.getTicketsByUser(req.params.user_id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get tickets failed", error: error.message });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const result = await supportService.getAllTickets();
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get all tickets failed", error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const result = await supportService.getTicketById(req.params.ticket_id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get ticket failed", error: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const result = await supportService.updateTicketStatus({
      ticket_id: req.params.ticket_id,
      status: req.body.status,
      actor_id: req.body.actor_id,
      actor_role: req.body.actor_role
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update status failed", error: error.message });
  }
};

exports.assignTicket = async (req, res) => {
  try {
    const result = await supportService.assignTicket({
      ticket_id: req.params.ticket_id,
      staff_id: req.body.staff_id,
      actor_id: req.body.actor_id,
      actor_role: req.body.actor_role
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Assign ticket failed", error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const result = await supportService.sendMessage({
      ticket_id: req.params.ticket_id,
      sender_id: req.body.sender_id,
      sender_role: req.body.sender_role,
      content: req.body.content
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Send message failed", error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const result = await supportService.getMessages(req.params.ticket_id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get messages failed", error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const result = await supportService.getHistory(req.params.ticket_id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get history failed", error: error.message });
  }
};
