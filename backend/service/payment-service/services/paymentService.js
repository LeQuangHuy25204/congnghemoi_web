const Payment = require("../models/Payment");

const createPayment = async ({ order_id, user_id, amount, method, status }) => {
  if (!order_id || !user_id || amount == null || !method) {
    return { status: 400, body: { message: "order_id, user_id, amount, method are required" } };
  }

  const payment = await Payment.create({
    order_id,
    user_id,
    amount: Number(amount),
    method,
    status: status || "paid"
  });

  return { status: 201, body: payment };
};

module.exports = {
  createPayment
};
