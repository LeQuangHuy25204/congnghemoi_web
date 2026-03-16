const express = require('express');
const cartController = require('../controllers/cartController');
const validateObjectId = require('../../shared/middlewares/validateObjectId');

const router = express.Router();

router.get('/:userId', validateObjectId('userId'), cartController.getCart);
router.post('/:userId/items', validateObjectId('userId'), cartController.addItem);
router.put('/:userId/items/:itemId', validateObjectId('userId'), validateObjectId('itemId'), cartController.updateItem);
router.delete('/:userId/items/:itemId', validateObjectId('userId'), validateObjectId('itemId'), cartController.removeItem);
router.delete('/:userId', validateObjectId('userId'), cartController.clearCart);

module.exports = router;
