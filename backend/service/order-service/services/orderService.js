const Order = require("../models/Order");
const mongoose = require("mongoose");
const axios = require("axios");

const ALLOWED_STATUSES = ["pending", "confirmed", "shipping", "completed", "cancelled"];

const STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["completed"],
  completed: [],
  cancelled: []
};

const normalizeStatus = (status) => (status || "").toLowerCase().trim();

const isValidStatus = (status) => ALLOWED_STATUSES.includes(normalizeStatus(status));

const productServiceBaseUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:5002";

const extractStockItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      product_id: item?.product_id,
      quantity: Number(item?.quantity)
    }))
    .filter((item) => item.product_id && Number.isFinite(item.quantity) && item.quantity > 0);
};

const callStockApi = async (operation, items) => {
  const response = await axios.post(
    `${productServiceBaseUrl}/api/products/stock/${operation}`,
    { items },
    { timeout: 10000 }
  );
  return response.data;
};

const createOrder = async ({ user_id, items }, actorUserId) => {
  const ownerUserId = actorUserId || user_id;
  const stockItems = extractStockItems(items);

  if (!ownerUserId || !Array.isArray(items) || items.length === 0 || stockItems.length === 0) {
    return { status: 400, body: { message: "user_id and items are required" } };
  }

  try {
    await callStockApi("decrement", stockItems);
  } catch (error) {
    const status = error?.response?.status || 400;
    const message = error?.response?.data?.message || "Reserve stock failed";
    return { status, body: { message } };
  }

  const total_price = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  try {
    const order = await Order.create({
      user_id: ownerUserId,
      items,
      total_price,
      status: "pending"
    });

    return { status: 201, body: order };
  } catch (error) {
    try {
      await callStockApi("increment", stockItems);
    } catch (_) {
      // Best effort rollback if order creation fails after reserving stock.
    }
    throw error;
  }
};

const getMyOrders = async (userId) => {
  if (!userId) {
    return { status: 401, body: { message: "Unauthorized" } };
  }

  const orders = await Order.find({ user_id: userId }).sort({ createdAt: -1 });
  return { status: 200, body: orders };
};

const getOrdersAdmin = async ({ status, q, page = 1, limit = 20 }) => {
  const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const filter = {};

  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus) {
    if (!isValidStatus(normalizedStatus)) {
      return { status: 400, body: { message: "Invalid status filter" } };
    }
    filter.status = normalizedStatus;
  }

  const keyword = (q || "").trim();
  if (keyword) {
    const orFilters = [
      { user_id: { $regex: keyword, $options: "i" } },
      { "items.product_name": { $regex: keyword, $options: "i" } }
    ];
    if (mongoose.Types.ObjectId.isValid(keyword)) {
      orFilters.push({ _id: keyword });
    }
    filter.$or = orFilters;
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    Order.countDocuments(filter)
  ]);

  return {
    status: 200,
    body: {
      items,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1)
    }
  };
};

const updateOrderStatusAdmin = async (id, status) => {
  const nextStatus = normalizeStatus(status);
  if (!nextStatus) {
    return { status: 400, body: { message: "status is required" } };
  }

  if (!isValidStatus(nextStatus)) {
    return { status: 400, body: { message: "Invalid order status" } };
  }

  const existing = await Order.findById(id);
  if (!existing) {
    return { status: 404, body: { message: "Order not found" } };
  }

  const currentStatus = normalizeStatus(existing.status);
  if (currentStatus === nextStatus) {
    return { status: 200, body: existing };
  }

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(nextStatus)) {
    return {
      status: 400,
      body: {
        message: `Cannot change status from ${currentStatus} to ${nextStatus}`
      }
    };
  }

  if (nextStatus === "cancelled") {
    const stockItems = extractStockItems(existing.items);
    try {
      await callStockApi("increment", stockItems);
    } catch (error) {
      const errorStatus = error?.response?.status || 400;
      const message = error?.response?.data?.message || "Restore stock failed";
      return { status: errorStatus, body: { message } };
    }
  }

  const order = await Order.findByIdAndUpdate(id, { status: nextStatus }, { new: true, runValidators: true });
  if (!order) {
    return { status: 404, body: { message: "Order not found" } };
  }

  return { status: 200, body: order };
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrdersAdmin,
  updateOrderStatusAdmin,
  ALLOWED_STATUSES
};
