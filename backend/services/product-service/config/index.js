const dotenv = require('dotenv');

dotenv.config();

const config = {
  serviceName: 'product-service',
  port: Number(process.env.PRODUCT_SERVICE_PORT || 4002),
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ecommerce-system',
};

module.exports = config;
