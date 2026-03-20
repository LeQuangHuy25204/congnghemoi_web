const Product = require("../models/Product");

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      product_id: item?.product_id,
      quantity: Number(item?.quantity)
    }))
    .filter((item) => item.product_id && Number.isFinite(item.quantity) && item.quantity > 0);
};

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

const adjustStock = async ({ items, operation }) => {
  const normalizedItems = normalizeItems(items);
  if (normalizedItems.length === 0) {
    return { status: 400, body: { message: "items are required" } };
  }

  if (operation !== "decrement" && operation !== "increment") {
    return { status: 400, body: { message: "Invalid stock operation" } };
  }

  const updatedProducts = [];

  for (const item of normalizedItems) {
    const query = { _id: item.product_id };
    if (operation === "decrement") {
      query.stock = { $gte: item.quantity };
    }

    const updated = await Product.findOneAndUpdate(
      query,
      { $inc: { stock: operation === "decrement" ? -item.quantity : item.quantity } },
      { new: true }
    );

    if (!updated) {
      return {
        status: 400,
        body: {
          message: operation === "decrement"
            ? `Insufficient stock or product not found: ${item.product_id}`
            : `Product not found: ${item.product_id}`
        }
      };
    }

    updatedProducts.push(updated);
  }

  return {
    status: 200,
    body: {
      message: `Stock ${operation} success`,
      items: updatedProducts
    }
  };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock
};
