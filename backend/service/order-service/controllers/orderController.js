const orderService = require("../services/orderService");

exports.createOrder = async (req, res) => {
  try {
    const actorUserId = req.headers["x-user-id"];
    const result = await orderService.createOrder(req.body, actorUserId);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Create order failed", error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const actorUserId = req.headers["x-user-id"];
    const result = await orderService.getMyOrders(actorUserId);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get orders failed", error: error.message });
  }
};

exports.getOrdersAdmin = async (req, res) => {
  try {
    const result = await orderService.getOrdersAdmin(req.query);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get admin orders failed", error: error.message });
  }
};

exports.getOrderAdmin = async (req, res) => {
  try {
    const result = await orderService.getOrderByIdAdmin(req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get order failed", error: error.message });
  }
};

exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const result = await orderService.updateOrderStatusAdmin(req.params.id, req.body.status);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update order failed", error: error.message });
  }
};

exports.updateOrderAdmin = async (req, res) => {
  try {
    const result = await orderService.updateOrderAdmin(req.params.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update order failed", error: error.message });
  }
};

exports.deleteOrderAdmin = async (req, res) => {
  try {
    const result = await orderService.deleteOrderAdmin(req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Delete order failed", error: error.message });
  }
};
