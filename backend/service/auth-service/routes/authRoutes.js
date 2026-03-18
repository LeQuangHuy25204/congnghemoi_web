const express = require("express");
const {
	register,
	login,
	verifyUser,
	getUsers,
	updateUser,
	updateUserStatus,
	updateMyProfile
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify", authMiddleware, verifyUser);
router.put("/me", authMiddleware, updateMyProfile);
router.get("/users", authMiddleware, getUsers);
router.put("/users/:id", authMiddleware, updateUser);
router.patch("/users/:id/status", authMiddleware, updateUserStatus);

module.exports = router;
