const dotenv = require('dotenv');

dotenv.config();

const config = {
  serviceName: 'chatbot-service',
  port: Number(process.env.CHATBOT_SERVICE_PORT || 4007),
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ecommerce-system',
};

module.exports = config;
