const asyncHandler = require('../../shared/utils/asyncHandler');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body);
  res.json(result);
});

module.exports = {
  register,
  login,
  refreshToken,
};
