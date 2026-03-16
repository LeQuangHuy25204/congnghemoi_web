const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const registerUser = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    return { status: 400, body: { message: "name, email, password are required" } };
  }

  const existed = await User.findOne({ email });
  if (existed) {
    return { status: 409, body: { message: "Email already exists" } };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, role: role || "customer" });

  return {
    status: 201,
    body: {
      message: "Register successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    return { status: 400, body: { message: "email and password are required" } };
  }

  const user = await User.findOne({ email });
  if (!user) {
    return { status: 401, body: { message: "Invalid credentials" } };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { status: 401, body: { message: "Invalid credentials" } };
  }

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "1d" }
  );

  return {
    status: 200,
    body: {
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  };
};

const verifyUserToken = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    return { status: 404, body: { message: "User not found" } };
  }

  return {
    status: 200,
    body: {
      message: "Token is valid",
      user
    }
  };
};

module.exports = {
  registerUser,
  loginUser,
  verifyUserToken
};
