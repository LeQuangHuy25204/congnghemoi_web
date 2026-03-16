const { registerUser, loginUser, verifyUserToken } = require("../services/authService");

exports.register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Register failed", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const result = await verifyUserToken(req.user.userId);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Verify token failed", error: error.message });
  }
};
