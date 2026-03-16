const paymentService = require("../services/paymentService");

exports.createPayment = async (req, res) => {
  try {
    const result = await paymentService.createPayment(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Payment failed", error: error.message });
  }
};
