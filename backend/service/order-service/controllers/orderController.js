const orderService = require("../services/orderService");

exports.createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Create order failed", error: error.message });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const result = await orderService.getOrdersByUser(req.params.user_id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get orders failed", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const result = await orderService.updateOrderStatus(req.params.id, req.body.status);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update order failed", error: error.message });
  }
};
