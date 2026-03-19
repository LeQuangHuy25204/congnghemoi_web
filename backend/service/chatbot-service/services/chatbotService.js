const ChatLog = require("../models/ChatLog");
const createProductDbConnection = require("../config/productDb");
const productSchema = require("../models/Product");
const { normalizeText, extractPriceVnd } = require("../utils/text");

const productDb = createProductDbConnection();
const Product = productDb.model("Product", productSchema, "products");

const replies = [
  "Mình tìm được các sản phẩm phù hợp:",
  "Bạn tham khảo các sản phẩm sau nhé:",
  "Dưới đây là những lựa chọn phù hợp:"
];

const pickReply = () => replies[Math.floor(Math.random() * replies.length)];

const isGreeting = (message) => {
  const text = normalizeText(message);
  const words = text.split(" ").filter(Boolean);
  if (words.includes("chao") || words.includes("hello") || words.includes("hi")) {
    return true;
  }
  for (let i = 0; i < words.length - 1; i += 1) {
    if (words[i] === "xin" && words[i + 1] === "chao") {
      return true;
    }
  }
  return false;
};

const removePricePhrase = (text) => {
  const priceRegex = /(\d+(?:[.,]\d+)?)\s*(trieu|tr|cu|k|nghin|ngan|dong|vnd|vnđ)/g;
  return text.replace(priceRegex, " ");
};

const normalizeWithDiacritics = (value) => {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractKeyword = (message) => {
  const original = normalizeWithDiacritics(removePricePhrase(message));
  const normalized = normalizeText(removePricePhrase(message));

  const stopWords = new Set(
    [
      "tư",
      "vấn",
      "gợi",
      "ý",
      "tôi",
      "mình",
      "muốn",
      "cần",
      "tìm",
      "mua",
      "sản",
      "phẩm",
      "loại",
      "nào",
      "cho",
      "đi",
      "giúp",
      "với",
      "có",
      "không",
      "dưới",
      "trên",
      "khoảng",
      "tầm",
      "giá",
      "mức",
      "ngân",
      "sách"
    ].map((w) => normalizeText(w))
  );

  const originalTokens = original.split(" ").filter(Boolean);
  const normalizedTokens = normalized.split(" ").filter(Boolean);
  const keptTokens = [];

  for (let i = 0; i < normalizedTokens.length; i += 1) {
    const n = normalizedTokens[i];
    if (!stopWords.has(n)) {
      keptTokens.push(originalTokens[i] || n);
    }
  }

  const keywordOriginal = keptTokens.join(" ").trim();
  const keywordNormalized = normalizeText(keywordOriginal);

  return {
    keywordOriginal,
    keywordNormalized
  };
};

const searchProductsByName = async ({ keywordOriginal, keywordNormalized, price }) => {
  const patterns = [];
  if (keywordOriginal) {
    patterns.push({ name: { $regex: keywordOriginal, $options: "i" } });
  }
  if (keywordNormalized && keywordNormalized !== keywordOriginal) {
    patterns.push({ name: { $regex: keywordNormalized, $options: "i" } });
  }

  const query = patterns.length > 0 ? { $or: patterns } : {};
  if (price) {
    query.price = { $lte: price };
  }

  return Product.find(query).limit(5);
};

const handleChat = async ({ user_id, message }) => {
  if (!message) {
    return { status: 400, body: { message: "message is required" } };
  }

  if (isGreeting(message)) {
    const reply = "Chào bạn! Bạn cần tư vấn sản phẩm nào?";
    ChatLog.create({
      user_id: user_id || "guest",
      message,
      response: reply,
      intent: "greeting"
    }).catch(() => {});

    return { status: 200, body: { reply, products: [] } };
  }

  const { keywordOriginal, keywordNormalized } = extractKeyword(message);
  if (!keywordOriginal && !keywordNormalized) {
    const reply = "Bạn đang tìm sản phẩm gì?";
    ChatLog.create({
      user_id: user_id || "guest",
      message,
      response: reply,
      intent: "unknown"
    }).catch(() => {});

    return { status: 200, body: { reply, products: [] } };
  }

  const price = extractPriceVnd(message);
  const products = await searchProductsByName({ keywordOriginal, keywordNormalized, price });

  if (!products || products.length === 0) {
    const reply = "Hiện tại mình chưa tìm thấy sản phẩm phù hợp 😅";
    ChatLog.create({
      user_id: user_id || "guest",
      message,
      response: reply,
      intent: "search"
    }).catch(() => {});

    return { status: 200, body: { reply, products: [] } };
  }

  const reply = pickReply();
  ChatLog.create({
    user_id: user_id || "guest",
    message,
    response: reply,
    intent: "search"
  }).catch(() => {});

  return {
    status: 200,
    body: {
      reply,
      products
    }
  };
};

module.exports = {
  handleChat
};

