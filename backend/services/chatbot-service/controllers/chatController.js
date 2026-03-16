const asyncHandler = require('../../shared/utils/asyncHandler');
const chatService = require('../services/chatService');

const respond = asyncHandler(async (req, res) => {
  const result = await chatService.respond(req.body);
  res.json(result);
});

module.exports = {
  respond,
};
