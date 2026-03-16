const express = require('express');
const paymentController = require('../controllers/paymentController');
const validateObjectId = require('../../shared/middlewares/validateObjectId');

const router = express.Router();

router.get('/:paymentId', validateObjectId('paymentId'), paymentController.getPayment);
router.post('/', paymentController.createPayment);
router.put('/:paymentId/status', validateObjectId('paymentId'), paymentController.updateStatus);

module.exports = router;
