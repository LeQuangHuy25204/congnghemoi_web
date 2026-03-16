const express = require('express');
const orderController = require('../controllers/orderController');
const validateObjectId = require('../../shared/middlewares/validateObjectId');

const router = express.Router();

router.get('/', orderController.listOrders);
router.get('/:orderId', validateObjectId('orderId'), orderController.getOrder);
router.post('/', orderController.createOrder);
router.put('/:orderId/status', validateObjectId('orderId'), orderController.updateStatus);

module.exports = router;
