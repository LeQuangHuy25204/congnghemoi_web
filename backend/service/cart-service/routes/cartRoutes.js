const express = require("express");
const {
  getCartByUser,
  addToCart,
  updateCartItem,
  removeFromCart
} = require("../controllers/cartController");

const router = express.Router();

router.get("/cart/:user_id", getCartByUser);
router.post("/cart/add", addToCart);
router.put("/cart/update", updateCartItem);
router.delete("/cart/remove", removeFromCart);

module.exports = router;
