const express = require("express");
const { createOrder, getOrdersByUser, updateOrderStatus } = require("../controllers/orderController");

const router = express.Router();

router.post("/orders", createOrder);
router.get("/orders/:user_id", getOrdersByUser);
router.put("/orders/:id/status", updateOrderStatus);

module.exports = router;
