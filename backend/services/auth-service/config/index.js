const dotenv = require('dotenv');

dotenv.config();

const config = {
  serviceName: 'auth-service',
  port: Number(process.env.AUTH_SERVICE_PORT || 4001),
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ecommerce-system',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};

module.exports = config;
