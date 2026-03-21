const express = require("express");
const {
	createOrder,
	getMyOrders,
	getOrdersAdmin,
	updateOrderStatusAdmin,
	getOrderAdmin,
	updateOrderAdmin,
	deleteOrderAdmin
} = require("../controllers/orderController");

const router = express.Router();

router.post("/orders", createOrder);
router.get("/orders/my", getMyOrders);
router.get("/orders/admin", getOrdersAdmin);
router.get("/orders/admin/:id", getOrderAdmin);
router.put("/orders/admin/:id/status", updateOrderStatusAdmin);
router.put("/orders/admin/:id", updateOrderAdmin);
router.delete("/orders/admin/:id", deleteOrderAdmin);

module.exports = router;
