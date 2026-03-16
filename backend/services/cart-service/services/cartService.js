const Cart = require('../models/Cart');
const AppError = require('../../shared/utils/appError');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  return { item: cart };
};

const addItem = async (userId, { productId, name, price, quantity }) => {
  if (!productId || !name || price == null || !quantity) {
    throw new AppError('Product, name, price and quantity are required', 400);
  }

  const cart = await getOrCreateCart(userId);

  const existing = cart.items.find((item) => item.productId.toString() === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, name, price, quantity });
  }

  await cart.save();
  return { item: cart };
};

const updateItem = async (userId, itemId, { quantity }) => {
  if (!quantity || quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) {
    throw new AppError('Cart item not found', 404);
  }

  item.quantity = quantity;
  await cart.save();
  return { item: cart };
};

const removeItem = async (userId, itemId) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) {
    throw new AppError('Cart item not found', 404);
  }

  item.remove();
  await cart.save();
  return { item: cart };
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
