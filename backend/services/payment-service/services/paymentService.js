const Payment = require('../models/Payment');
const AppError = require('../../shared/utils/appError');

const getPayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }
  return { item: payment };
};

const createPayment = async ({ orderId, amount, currency, provider, metadata }) => {
  if (!orderId || amount == null || !provider) {
    throw new AppError('Order, amount and provider are required', 400);
  }

  const payment = await Payment.create({
    orderId,
    amount,
    currency,
    provider,
    metadata,
  });

  return { item: payment };
};

const updateStatus = async (paymentId, { status }) => {
  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const payment = await Payment.findByIdAndUpdate(paymentId, { status }, { new: true });
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  return { item: payment };
};

module.exports = {
  getPayment,
  createPayment,
  updateStatus,
};
