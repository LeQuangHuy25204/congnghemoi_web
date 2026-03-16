const dotenv = require('dotenv');

dotenv.config();

const config = {
  serviceName: 'order-service',
  port: Number(process.env.ORDER_SERVICE_PORT || 4004),
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ecommerce-system',
};

module.exports = config;
