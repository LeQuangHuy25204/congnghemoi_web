const productService = require("../services/productService");

exports.getProducts = async (req, res) => {
  try {
    const result = await productService.getProducts(req.query);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get products failed", error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const result = await productService.getProductById(req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Get product failed", error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const result = await productService.createProduct(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(400).json({ message: "Create product failed", error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const result = await productService.updateProduct(req.params.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(400).json({ message: "Update product failed", error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Delete product failed", error: error.message });
  }
};

exports.decrementStock = async (req, res) => {
  try {
    const result = await productService.adjustStock({ items: req.body?.items, operation: "decrement" });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(400).json({ message: "Decrement stock failed", error: error.message });
  }
};

exports.incrementStock = async (req, res) => {
  try {
    const result = await productService.adjustStock({ items: req.body?.items, operation: "increment" });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(400).json({ message: "Increment stock failed", error: error.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    return res.status(201).json({
      message: "Upload image success",
      image: `/img/${req.file.filename}`
    });
  } catch (error) {
    return res.status(400).json({ message: "Upload image failed", error: error.message });
  }
};
