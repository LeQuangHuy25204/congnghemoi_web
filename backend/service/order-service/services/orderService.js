const Order = require("../models/Order");

const createOrder = async ({ user_id, items, status }) => {
  if (!user_id || !Array.isArray(items) || items.length === 0) {
    return { status: 400, body: { message: "user_id and items are required" } };
  }

  const total_price = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  const order = await Order.create({
    user_id,
    items,
    total_price,
    status: status || "pending"
  });

  return { status: 201, body: order };
};

const getOrdersByUser = async (userId) => {
  const orders = await Order.find({ user_id: userId }).sort({ createdAt: -1 });
  return { status: 200, body: orders };
};

const updateOrderStatus = async (id, status) => {
  if (!status) {
    return { status: 400, body: { message: "status is required" } };
  }

  const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!order) {
    return { status: 404, body: { message: "Order not found" } };
  }

  return { status: 200, body: order };
};

module.exports = {
  createOrder,
  getOrdersByUser,
  updateOrderStatus
};
