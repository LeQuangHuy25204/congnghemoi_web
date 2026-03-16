const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const config = {
  port: Number(process.env.API_GATEWAY_PORT || 4000),
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:4002',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:4003',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:4004',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4005',
    support: process.env.SUPPORT_SERVICE_URL || 'http://localhost:4006',
    chatbot: process.env.CHATBOT_SERVICE_URL || 'http://localhost:4007',
  },
};

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', time: new Date().toISOString() });
});

app.use('/api/auth', createProxyMiddleware({ target: config.services.auth, changeOrigin: true }));
app.use('/api/products', createProxyMiddleware({ target: config.services.product, changeOrigin: true }));
app.use('/api/carts', createProxyMiddleware({ target: config.services.cart, changeOrigin: true }));
app.use('/api/orders', createProxyMiddleware({ target: config.services.order, changeOrigin: true }));
app.use('/api/payments', createProxyMiddleware({ target: config.services.payment, changeOrigin: true }));
app.use('/api/tickets', createProxyMiddleware({ target: config.services.support, changeOrigin: true }));
app.use('/api/chat', createProxyMiddleware({ target: config.services.chatbot, changeOrigin: true }));

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api-gateway] listening on port ${config.port}`);
});
