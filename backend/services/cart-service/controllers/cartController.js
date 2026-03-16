const asyncHandler = require('../../shared/utils/asyncHandler');
const cartService = require('../services/cartService');

const getCart = asyncHandler(async (req, res) => {
  const result = await cartService.getCart(req.params.userId);
  res.json(result);
});

const addItem = asyncHandler(async (req, res) => {
  const result = await cartService.addItem(req.params.userId, req.body);
  res.status(201).json(result);
});

const updateItem = asyncHandler(async (req, res) => {
  const result = await cartService.updateItem(req.params.userId, req.params.itemId, req.body);
  res.json(result);
});

const removeItem = asyncHandler(async (req, res) => {
  const result = await cartService.removeItem(req.params.userId, req.params.itemId);
  res.json(result);
});

const clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.params.userId);
  res.status(204).send();
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
