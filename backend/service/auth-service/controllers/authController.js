const {
  registerUser,
  loginUser,
  verifyUserToken,
  listUsers,
  createUserByAdmin,
  updateUserByAdmin,
  updateUserStatusByAdmin,
  updateOwnProfile,
  deleteUserByAdmin
} = require("../services/authService");

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

const requireAdminRole = (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Admin role is required" });
    return false;
  }
  return true;
};

exports.getUsers = async (req, res) => {
  if (!requireAdminRole(req, res)) return;
  try {
    const result = await listUsers();
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get users failed", error: error.message });
  }
};

exports.createUser = async (req, res) => {
  if (!requireAdminRole(req, res)) return;
  try {
    const result = await createUserByAdmin(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Create user failed", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  if (!requireAdminRole(req, res)) return;
  try {
    const result = await updateUserByAdmin(req.params.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update user failed", error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  if (!requireAdminRole(req, res)) return;
  try {
    const result = await updateUserStatusByAdmin(req.params.id, req.body?.isActive, req.user.userId);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update user status failed", error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  if (!requireAdminRole(req, res)) return;
  try {
    const result = await deleteUserByAdmin(req.params.id, req.user.userId);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Delete user failed", error: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const result = await updateOwnProfile(req.user.userId, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update profile failed", error: error.message });
  }
};
