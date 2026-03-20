const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  decrementStock,
  incrementStock
} = require("../controllers/productController");
const { uploadProductImage } = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.post("/products/upload-image", (req, res) => {
  uploadProductImage.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: "Upload image failed", error: error.message });
    }

    return uploadImage(req, res);
  });
});
router.post("/products/stock/decrement", decrementStock);
router.post("/products/stock/increment", incrementStock);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

module.exports = router;
