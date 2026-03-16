const Product = require("../models/Product");

const getProducts = async ({ q, category, brand }) => {
  const filter = {};

  if (q) {
    filter.name = { $regex: q, $options: "i" };
  }
  if (category) {
    filter.category = category;
  }
  if (brand) {
    filter.brand = brand;
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  return { status: 200, body: products };
};

const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    return { status: 404, body: { message: "Product not found" } };
  }
  return { status: 200, body: product };
};

const createProduct = async (payload) => {
  const created = await Product.create(payload);
  return { status: 201, body: created };
};

const updateProduct = async (id, payload) => {
  const updated = await Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });

  if (!updated) {
    return { status: 404, body: { message: "Product not found" } };
  }

  return { status: 200, body: updated };
};

const deleteProduct = async (id) => {
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) {
    return { status: 404, body: { message: "Product not found" } };
  }
  return { status: 200, body: { message: "Product deleted" } };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
