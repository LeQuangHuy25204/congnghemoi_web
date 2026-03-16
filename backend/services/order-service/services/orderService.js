const Order = require('../models/Order');
const AppError = require('../../shared/utils/appError');

const computeTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const listOrders = async ({ userId }) => {
  const query = {};
  if (userId) query.userId = userId;

  const orders = await Order.find(query).sort({ createdAt: -1 });
  return { items: orders };
};

const getOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  return { item: order };
};

const createOrder = async ({ userId, items, currency }) => {
  if (!userId || !Array.isArray(items) || items.length === 0) {
    throw new AppError('User and items are required', 400);
  }

  const totalAmount = computeTotal(items);

  const order = await Order.create({
    userId,
    items,
    totalAmount,
    currency,
  });

  return { item: order };
};

const updateStatus = async (orderId, { status }) => {
  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return { item: order };
};

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateStatus,
};
