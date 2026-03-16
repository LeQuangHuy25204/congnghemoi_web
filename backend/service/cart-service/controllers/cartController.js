const cartService = require("../services/cartService");

exports.getCartByUser = async (req, res) => {
  try {
    const result = await cartService.getCartByUser(req.params.user_id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get cart failed", error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const result = await cartService.addToCart(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Add to cart failed", error: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const result = await cartService.updateCartItem(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Update cart failed", error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const result = await cartService.removeFromCart(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Remove cart item failed", error: error.message });
  }
};
