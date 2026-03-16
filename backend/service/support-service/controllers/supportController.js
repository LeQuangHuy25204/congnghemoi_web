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
