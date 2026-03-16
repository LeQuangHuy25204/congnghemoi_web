const Product = require('../models/Product');
const AppError = require('../../shared/utils/appError');

const listProducts = async ({ status, search }) => {
  const query = {};
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: 'i' };

  const products = await Product.find(query).sort({ createdAt: -1 });
  return { items: products };
};

const getProduct = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return { item: product };
};

const createProduct = async ({ name, description, price, currency, stock, categories, images }) => {
  if (!name || price == null) {
    throw new AppError('Name and price are required', 400);
  }

  const product = await Product.create({
    name,
    description,
    price,
    currency,
    stock,
    categories,
    images,
  });

  return { item: product };
};

const updateProduct = async (productId, updates) => {
  const product = await Product.findByIdAndUpdate(productId, updates, { new: true });
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return { item: product };
};

const deleteProduct = async (productId) => {
  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
};

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
