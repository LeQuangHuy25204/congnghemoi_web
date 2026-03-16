const express = require('express');
const productController = require('../controllers/productController');
const validateObjectId = require('../../shared/middlewares/validateObjectId');

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/:productId', validateObjectId('productId'), productController.getProduct);
router.post('/', productController.createProduct);
router.put('/:productId', validateObjectId('productId'), productController.updateProduct);
router.delete('/:productId', validateObjectId('productId'), productController.deleteProduct);

module.exports = router;
