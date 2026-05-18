const paymentService = require("../services/paymentService");

const getActor = (req) => ({
  actorUserId: req.headers["x-user-id"] || "",
  actorRole: req.headers["x-user-role"] || "customer"
});

exports.createPayment = async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await paymentService.createPayment(req.body, actor.actorUserId, actor.actorRole);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error?.data?.message || error.message || "Payment failed",
      error: error.data || error.message
    });
  }
};

exports.listPayments = async (req, res) => {
  try {
    const actor = getActor(req);
    const result = await paymentService.listPayments({ ...actor, query: req.query });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get payments failed", error: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const result = await paymentService.getPaymentById(req.params.id, req.headers["x-user-id"], req.headers["x-user-role"]);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(error.status || 500).json({ message: "Get payment failed", error: error.data || error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const result = await paymentService.updatePaymentStatus(req.params.id, req.body.status, req.headers["x-user-role"]);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update payment failed", error: error.message });
  }
};

exports.getPaymentSepay = async (req, res) => {
  try {
    const result = await paymentService.getPaymentSepay(req.params.id, req.headers["x-user-id"], req.headers["x-user-role"]);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error?.data?.message || error.message || "Get SePay transfer failed",
      error: error.data || error.message
    });
  }
};
