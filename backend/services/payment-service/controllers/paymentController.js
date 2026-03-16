const asyncHandler = require('../../shared/utils/asyncHandler');
const paymentService = require('../services/paymentService');

const getPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.getPayment(req.params.paymentId);
  res.json(result);
});

const createPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.createPayment(req.body);
  res.status(201).json(result);
});

const updateStatus = asyncHandler(async (req, res) => {
  const result = await paymentService.updateStatus(req.params.paymentId, req.body);
  res.json(result);
});

module.exports = {
  getPayment,
  createPayment,
  updateStatus,
};
