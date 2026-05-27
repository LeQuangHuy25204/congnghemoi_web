const express = require("express");
const {
	createOrder,
	getMyOrders,
	getOrdersAdmin,
	updateOrderStatusAdmin,
	getOrderAdmin,
	updateOrderAdmin,
	deleteOrderAdmin,
	updateOrderStatus
} = require("../controllers/orderController");

const router = express.Router();

router.post("/orders", createOrder);
router.get("/orders/my", getMyOrders);
router.get("/orders/admin", getOrdersAdmin);
router.get("/orders/admin/:id", getOrderAdmin);
router.put("/orders/admin/:id/status", updateOrderStatusAdmin);
router.put("/orders/admin/:id", updateOrderAdmin);
router.delete("/orders/admin/:id", deleteOrderAdmin);
router.put("/orders/internal/:id/status", updateOrderStatusAdmin); // Internal: for payment service
router.put("/orders/:id/status", updateOrderStatus);

module.exports = router;
