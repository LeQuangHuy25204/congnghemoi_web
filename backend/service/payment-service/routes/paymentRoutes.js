const express = require("express");
const { createPayment } = require("../controllers/paymentController");

const router = express.Router();

router.post("/payment", createPayment);

module.exports = router;
