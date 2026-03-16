const asyncHandler = require('../../shared/utils/asyncHandler');
const orderService = require('../services/orderService');

const listOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listOrders(req.query);
  res.json(result);
});

const getOrder = asyncHandler(async (req, res) => {
  const result = await orderService.getOrder(req.params.orderId);
  res.json(result);
});

const createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.body);
  res.status(201).json(result);
});

const updateStatus = asyncHandler(async (req, res) => {
  const result = await orderService.updateStatus(req.params.orderId, req.body);
  res.json(result);
});

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateStatus,
};
