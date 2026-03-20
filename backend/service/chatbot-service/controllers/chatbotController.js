const { handleChat } = require("../services/chatbotService");

exports.chat = async (req, res) => {
  try {
    const actorUserId = req.headers["x-user-id"];
    const result = await handleChat({
      ...req.body,
      actor_user_id: actorUserId
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Chatbot error", error: error.message });
  }
};
