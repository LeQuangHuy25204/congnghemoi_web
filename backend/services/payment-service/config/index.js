const dotenv = require('dotenv');

dotenv.config();

const config = {
  serviceName: 'payment-service',
  port: Number(process.env.PAYMENT_SERVICE_PORT || 4005),
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ecommerce-system',
};

module.exports = config;
