const express = require("express");
const {
	createOrder,
	getMyOrders,
	getOrdersAdmin,
	updateOrderStatusAdmin
} = require("../controllers/orderController");

const router = express.Router();

router.post("/orders", createOrder);
router.get("/orders/my", getMyOrders);
router.get("/orders/admin", getOrdersAdmin);
router.put("/orders/admin/:id/status", updateOrderStatusAdmin);

module.exports = router;
