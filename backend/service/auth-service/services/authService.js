const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const registerUser = async ({ name, email, password, phone, shippingAddress, role }) => {
  if (!name || !email || !password || !phone || !shippingAddress) {
    return { status: 400, body: { message: "name, email, password, phone, shippingAddress are required" } };
  }

  const existed = await User.findOne({ email });
  if (existed) {
    return { status: 409, body: { message: "Email already exists" } };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    shippingAddress,
    role: role || "customer"
  });

  return {
    status: 201,
    body: {
      message: "Register successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        shippingAddress: user.shippingAddress,
        role: user.role
      }
    }
  };
};

const createUserByAdmin = async ({ name, email, password, phone, shippingAddress, role, isActive }) => {
  if (!name || !email || !password || !phone || !shippingAddress) {
    return { status: 400, body: { message: "name, email, password, phone, shippingAddress are required" } };
  }

  const existed = await User.findOne({ email });
  if (existed) {
    return { status: 409, body: { message: "Email already exists" } };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    shippingAddress,
    role: role || "customer",
    isActive: typeof isActive === "boolean" ? isActive : true
  });

  return {
    status: 201,
    body: {
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        shippingAddress: user.shippingAddress,
        role: user.role,
        isActive: user.isActive
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

  if (user.isActive === false) {
    return { status: 403, body: { message: "Account is locked. Please contact admin." } };
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
        phone: user.phone,
        shippingAddress: user.shippingAddress,
        isActive: user.isActive,
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

const listUsers = async () => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return {
    status: 200,
    body: {
      message: "Users fetched successfully",
      users
    }
  };
};

const updateUserByAdmin = async (userId, payload) => {
  const allowed = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    shippingAddress: payload.shippingAddress,
    role: payload.role
  };

  Object.keys(allowed).forEach((key) => {
    if (allowed[key] === undefined || allowed[key] === null || allowed[key] === "") {
      delete allowed[key];
    }
  });

  if (payload.password) {
    allowed.password = await bcrypt.hash(payload.password, 10);
  }

  if (Object.keys(allowed).length === 0) {
    return { status: 400, body: { message: "No valid fields to update" } };
  }

  if (allowed.email) {
    const existed = await User.findOne({ email: allowed.email, _id: { $ne: userId } });
    if (existed) {
      return { status: 409, body: { message: "Email already exists" } };
    }
  }

  const user = await User.findByIdAndUpdate(userId, allowed, { new: true, runValidators: true }).select("-password");
  if (!user) {
    return { status: 404, body: { message: "User not found" } };
  }

  return {
    status: 200,
    body: {
      message: "User updated successfully",
      user
    }
  };
};

const deleteUserByAdmin = async (userId, currentAdminId) => {
  if (userId === currentAdminId) {
    return { status: 400, body: { message: "You cannot delete your own account" } };
  }

  const user = await User.findByIdAndDelete(userId).select("-password");
  if (!user) {
    return { status: 404, body: { message: "User not found" } };
  }

  return {
    status: 200,
    body: {
      message: "User deleted successfully",
      user
    }
  };
};

const updateUserStatusByAdmin = async (userId, isActive, currentAdminId) => {
  if (typeof isActive !== "boolean") {
    return { status: 400, body: { message: "isActive must be boolean" } };
  }

  if (userId === currentAdminId) {
    return { status: 400, body: { message: "You cannot lock your own account" } };
  }

  const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true, runValidators: true }).select("-password");
  if (!user) {
    return { status: 404, body: { message: "User not found" } };
  }

  return {
    status: 200,
    body: {
      message: "User status updated successfully",
      user
    }
  };
};

const updateOwnProfile = async (userId, payload) => {
  const allowed = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    shippingAddress: payload.shippingAddress
  };

  Object.keys(allowed).forEach((key) => {
    if (allowed[key] === undefined || allowed[key] === null || allowed[key] === "") {
      delete allowed[key];
    }
  });

  if (Object.keys(allowed).length === 0) {
    return { status: 400, body: { message: "No valid fields to update" } };
  }

  if (allowed.email) {
    const existed = await User.findOne({ email: allowed.email, _id: { $ne: userId } });
    if (existed) {
      return { status: 409, body: { message: "Email already exists" } };
    }
  }

  const user = await User.findByIdAndUpdate(userId, allowed, { new: true, runValidators: true }).select("-password");
  if (!user) {
    return { status: 404, body: { message: "User not found" } };
  }

  return {
    status: 200,
    body: {
      message: "Profile updated successfully",
      user
    }
  };
};

module.exports = {
  registerUser,
  loginUser,
  verifyUserToken,
  listUsers,
  createUserByAdmin,
  updateUserByAdmin,
  updateUserStatusByAdmin,
  updateOwnProfile,
  deleteUserByAdmin
};
