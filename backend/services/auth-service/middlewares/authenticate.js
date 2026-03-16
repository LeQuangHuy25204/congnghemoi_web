const jwt = require('jsonwebtoken');
const AppError = require('../../shared/utils/appError');
const config = require('../config');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError('Missing authorization token', 401));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    return next(new AppError('Invalid token', 401));
  }
};

module.exports = authenticate;
