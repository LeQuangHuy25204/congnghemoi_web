const Cart = require("../models/Cart");

const getCartByUser = async (userId) => {
  const cart = await Cart.findOne({ user_id: userId });
  return { status: 200, body: cart || { user_id: userId, items: [] } };
};

const addToCart = async ({ user_id, product_id, product_name, price, quantity }) => {
  if (!user_id || !product_id || !product_name || price == null || quantity == null) {
    return { status: 400, body: { message: "Missing required fields" } };
  }

  let cart = await Cart.findOne({ user_id });
  if (!cart) {
    cart = new Cart({ user_id, items: [] });
  }

  const item = cart.items.find((i) => i.product_id === product_id);
  if (item) {
    item.quantity += Number(quantity);
  } else {
    cart.items.push({
      product_id,
      product_name,
      price: Number(price),
      quantity: Number(quantity)
    });
  }

  await cart.save();
  return { status: 200, body: cart };
};

const updateCartItem = async ({ user_id, product_id, quantity }) => {
  if (!user_id || !product_id || quantity == null) {
    return { status: 400, body: { message: "Missing required fields" } };
  }

  const cart = await Cart.findOne({ user_id });
  if (!cart) {
    return { status: 404, body: { message: "Cart not found" } };
  }

  const item = cart.items.find((i) => i.product_id === product_id);
  if (!item) {
    return { status: 404, body: { message: "Item not found" } };
  }

  item.quantity = Number(quantity);
  await cart.save();

  return { status: 200, body: cart };
};

const removeFromCart = async ({ user_id, product_id }) => {
  if (!user_id || !product_id) {
    return { status: 400, body: { message: "Missing required fields" } };
  }

  const cart = await Cart.findOne({ user_id });
  if (!cart) {
    return { status: 404, body: { message: "Cart not found" } };
  }

  cart.items = cart.items.filter((i) => i.product_id !== product_id);
  await cart.save();

  return { status: 200, body: cart };
};

module.exports = {
  getCartByUser,
  addToCart,
  updateCartItem,
  removeFromCart
};
