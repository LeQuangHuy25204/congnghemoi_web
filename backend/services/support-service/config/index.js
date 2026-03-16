const dotenv = require('dotenv');

dotenv.config();

const config = {
  serviceName: 'support-service',
  port: Number(process.env.SUPPORT_SERVICE_PORT || 4006),
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ecommerce-system',
};

module.exports = config;
