const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const AppError = require('../../shared/utils/appError');
const config = require('../config');

const generateToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

const register = async ({ email, password, fullName }) => {
  if (!email || !password || !fullName) {
    throw new AppError('Email, password and full name are required', 400);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already in use', 409);
  }

  // Hash password before storage
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email,
    passwordHash,
    fullName,
  });

  return {
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    accessToken: generateToken(user),
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError('Invalid credentials', 401);
  }

  return {
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    accessToken: generateToken(user),
  };
};

const refreshToken = async ({ token }) => {
  if (!token) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      accessToken: generateToken(user),
    };
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
};
