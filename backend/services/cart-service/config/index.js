const dotenv = require('dotenv');

dotenv.config();

const config = {
  serviceName: 'cart-service',
  port: Number(process.env.CART_SERVICE_PORT || 4003),
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ecommerce-system',
};

module.exports = config;
