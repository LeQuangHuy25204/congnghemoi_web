const express = require("express");
const {
  createPayment,
  listPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentVietQr
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/payment", createPayment);
router.get("/payment", listPayments);
router.get("/payment/:id", getPaymentById);
router.patch("/payment/:id/status", updatePaymentStatus);
router.get("/payment/:id/vietqr", getPaymentVietQr);

module.exports = router;
