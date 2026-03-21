const express = require("express");
const {
	register,
	login,
	verifyUser,
	getUsers,
	updateUser,
	updateUserStatus,
	updateMyProfile,
	createUser,
	deleteUser
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify", authMiddleware, verifyUser);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/users", authMiddleware, getUsers);
router.post("/users", authMiddleware, createUser);
router.put("/users/:id", authMiddleware, updateUser);
router.patch("/users/:id/status", authMiddleware, updateUserStatus);
router.delete("/users/:id", authMiddleware, deleteUser);

module.exports = router;
