const asyncHandler = require('../../shared/utils/asyncHandler');
const productService = require('../services/productService');

const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query);
  res.json(result);
});

const getProduct = asyncHandler(async (req, res) => {
  const result = await productService.getProduct(req.params.productId);
  res.json(result);
});

const createProduct = asyncHandler(async (req, res) => {
  const result = await productService.createProduct(req.body);
  res.status(201).json(result);
});

const updateProduct = asyncHandler(async (req, res) => {
  const result = await productService.updateProduct(req.params.productId, req.body);
  res.json(result);
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.productId);
  res.status(204).send();
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
