require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const authService = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const productService = process.env.PRODUCT_SERVICE_URL || "http://localhost:5002";
const cartService = process.env.CART_SERVICE_URL || "http://localhost:5003";
const orderService = process.env.ORDER_SERVICE_URL || "http://localhost:5004";
const paymentService = process.env.PAYMENT_SERVICE_URL || "http://localhost:5005";
const chatbotService = process.env.CHATBOT_SERVICE_URL || "http://localhost:5006";
const supportService = process.env.SUPPORT_SERVICE_URL || "http://localhost:5007";

app.use(cors());

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin role is required" });
  }
  return next();
};

const productAccessControl = (req, res, next) => {
  if (req.method === "GET") {
    return next();
  }

  return requireAuth(req, res, () => requireAdmin(req, res, next));
};

app.get("/health", (req, res) => {
  res.status(200).json({ service: "api-gateway", status: "ok" });
});

app.use(
  "/api/auth",
  createProxyMiddleware({
    target: authService,
    changeOrigin: true,
    pathRewrite: (path) => `/api/auth${path}`
  })
);

app.use(
  "/api/products",
  productAccessControl,
  createProxyMiddleware({
    target: productService,
    changeOrigin: true,
    pathRewrite: (path) => `/api/products${path}`
  })
);

app.use(
  "/api/cart",
  requireAuth,
  createProxyMiddleware({
    target: cartService,
    changeOrigin: true,
    pathRewrite: (path) => `/api/cart${path}`
  })
);

app.use(
  "/api/orders",
  requireAuth,
  createProxyMiddleware({
    target: orderService,
    changeOrigin: true,
    pathRewrite: (path) => `/api/orders${path}`
  })
);

app.use(
  "/api/payment",
  requireAuth,
  createProxyMiddleware({
    target: paymentService,
    changeOrigin: true,
    pathRewrite: (path) => `/api/payment${path}`
  })
);

app.use(
  "/api/chat",
  requireAuth,
  createProxyMiddleware({
    target: chatbotService,
    changeOrigin: true,
    pathRewrite: (path) => `/api/chat${path}`
  })
);

app.use(
  "/api/support",
  requireAuth,
  createProxyMiddleware({
    target: supportService,
    changeOrigin: true,
    pathRewrite: (path) => `/api/support${path}`
  })
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
