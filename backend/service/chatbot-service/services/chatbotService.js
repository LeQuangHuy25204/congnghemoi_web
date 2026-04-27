const axios = require("axios");
const ChatLog = require("../models/ChatLog");
const createProductDbConnection = require("../config/productDb");
const productSchema = require("../models/Product");
const { normalizeText, extractPriceVnd } = require("../utils/text");

const productDb = createProductDbConnection();
const Product = productDb.model("Product", productSchema, "products");
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:5004";

const replies = [
  "Mình tìm được vài sản phẩm khá sát nhu cầu của bạn:",
  "Bạn tham khảo các sản phẩm phù hợp này nhé:",
  "Dưới đây là những lựa chọn mình lọc được cho bạn:"
];

const pickReply = () => replies[Math.floor(Math.random() * replies.length)];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const isGeminiEnabled = () => Boolean(GEMINI_API_KEY);

const ORDER_INTENT_KEYWORDS = [
  "don hang",
  "don cua toi",
  "don cua minh",
  "tra cuu don",
  "kiem tra don",
  "xem don",
  "xem lich su mua",
  "tinh trang don",
  "trang thai don",
  "lich su mua",
  "lich su don hang",
  "order",
  "orders",
  "my order"
];

const GREETING_KEYWORDS = ["chao", "xin chao", "hello", "hi", "alo", "hey"];
const IN_STOCK_KEYWORDS = ["con hang", "san hang", "co hang", "ton kho", "available"];
const APPROXIMATE_BUDGET_KEYWORDS = ["tam", "tam gia", "khoang", "duoi", "toi da", "gan"];

const CATEGORY_ALIASES = {
  "dien thoai": ["dien thoai", "smartphone", "phone", "mobile", "dt", "dthoai"],
  laptop: ["laptop", "notebook", "may tinh xach tay"],
  tablet: ["tablet", "ipad", "may tinh bang"],
  accessory: ["phu kien", "accessory", "tai nghe", "sac", "cap", "op lung"]
};

const BRAND_ALIASES = {
  apple: ["apple", "iphone", "ipad"],
  samsung: ["samsung", "galaxy"],
  oppo: ["oppo"],
  xiaomi: ["xiaomi", "redmi"],
  honor: ["honor"],
  vivo: ["vivo"],
  realme: ["realme"],
  nokia: ["nokia"]
};

const STOP_WORDS = new Set(
  [
    "tu",
    "van",
    "goi",
    "y",
    "toi",
    "minh",
    "em",
    "anh",
    "chi",
    "muon",
    "can",
    "tim",
    "mua",
    "san",
    "pham",
    "loai",
    "nao",
    "cho",
    "di",
    "giup",
    "voi",
    "co",
    "khong",
    "duoi",
    "tren",
    "khoang",
    "tam",
    "gia",
    "muc",
    "ngan",
    "sach",
    "va",
    "hay",
    "roi",
    "nhe",
    "nha",
    "giup minh",
    "co the",
    "tim giup",
    "con",
    "hang",
    "may",
    "cua",
    "lo"
  ].map((word) => normalizeText(word))
);

const STATUS_LABELS = {
  pending: "Đang chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy"
};

const formatPrice = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `${value.toLocaleString("vi-VN")} VND`;
};

const normalizeWithDiacritics = (value) => {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const containsKeyword = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const getOrderStatusLabel = (status) => STATUS_LABELS[status] || status || "khong ro";

const formatOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "(chưa có sản phẩm)";
  }

  return items
    .slice(0, 5)
    .map((item, index) => {
      const name = item?.product_name || item?.name || "Sản phẩm";
      const quantity = Number(item?.quantity || 0);
      const price = Number(item?.price || 0);
      return `   ${index + 1}) ${name} | SL: ${quantity} | Giá: ${formatPrice(price)}`;
    })
    .join("\n");
};

const formatSingleOrderBlock = (order, index) => {
  const orderId = order?._id || order?.id || "N/A";
  const status = getOrderStatusLabel(order?.status);
  const total = formatPrice(Number(order?.total_price || order?.total || 0));
  const productLines = formatOrderItems(order?.items);

  return [
    `📦 Đơn ${index + 1}`,
    `- Mã đơn: ${orderId}`,
    `- Trạng thái: ${status}`,
    `- Sản phẩm:`,
    productLines,
    `- Tổng tiền: ${total}`
  ].join("\n");
};

const isOrderLookupIntent = (message) => {
  const text = normalizeText(message);
  return containsKeyword(text, ORDER_INTENT_KEYWORDS);
};

const extractOrderCode = (message) => {
  const raw = (message || "").trim();
  const objectIdMatch = raw.match(/([a-fA-F0-9]{24})/);
  if (objectIdMatch && objectIdMatch[1]) {
    return objectIdMatch[1];
  }

  const prefixedCodeMatch = raw.match(/(?:don|order|ma|code)\s*[#: -]?\s*([A-Za-z0-9_-]{6,})/i);
  if (prefixedCodeMatch && prefixedCodeMatch[1]) {
    return prefixedCodeMatch[1];
  }

  return null;
};

const buildOrdersContext = (orders) => {
  if (!orders || orders.length === 0) {
    return "Khong co don hang nao.";
  }

  return orders
    .slice(0, 5)
    .map((order, index) => {
      const id = order?._id || order?.id || "N/A";
      const status = getOrderStatusLabel(order?.status);
      const total = formatPrice(order?.total_price || order?.total || 0);
      const itemCount = Array.isArray(order?.items)
        ? order.items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
        : 0;
      return `${index + 1}. Don ${id} | Trang thai: ${status} | Tong: ${total} | So luong SP: ${itemCount}`;
    })
    .join("\n");
};

const fetchMyOrders = async (userId) => {
  if (!userId) {
    return { ok: false, status: 401, message: "missing_user" };
  }

  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/my`, {
      timeout: 10000,
      headers: {
        "x-user-id": userId
      }
    });

    const data = response?.data;
    const orders = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return { ok: true, orders };
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = error?.response?.data?.message || "order_lookup_failed";
    return { ok: false, status, message };
  }
};

const buildProductsContext = (products) => {
  if (!products || products.length === 0) {
    return "Khong co san pham phu hop.";
  }

  return products
    .map((product, index) => {
      const name = product?.name || "San pham";
      const price = formatPrice(product?.price);
      const stock = product?.stock ?? "N/A";
      return `${index + 1}. ${name} | Gia: ${price} | Ton kho: ${stock}`;
    })
    .join("\n");
};

const generateGeminiReply = async ({ message, products, price }) => {
  if (!isGeminiEnabled()) return null;

  const priceText = typeof price === "number" ? `${price.toLocaleString("vi-VN")} VND` : "khong de cap";
  const productsContext = buildProductsContext(products);

  const prompt = [
    "Ban la tro ly ban hang cho website thuong mai dien tu.",
    "Tra loi bang tieng Viet, ngan gon (2-4 cau), than thien, de hieu.",
    "Neu co san pham: tom tat nhanh diem noi bat va goi y 1 cau hoi tiep theo.",
    "Neu khong co san pham: xin loi ngan gon va goi y nguoi dung doi tu khoa hoac ngan sach.",
    `Tin nhan nguoi dung: ${message}`,
    `Muc gia trich xuat: ${priceText}`,
    "Danh sach san pham tim duoc:",
    productsContext
  ].join("\n");

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 220
        }
      },
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string") return null;
    return text.trim();
  } catch (error) {
    return null;
  }
};

const generateGeminiOrderReply = async ({ message, orders, queriedOrderCode }) => {
  if (!isGeminiEnabled()) return null;

  const ordersContext = buildOrdersContext(orders);
  const prompt = [
    "Ban la tro ly ho tro don hang cho website thuong mai dien tu.",
    "Tra loi bang tieng Viet, ngan gon va ro rang (2-4 cau).",
    queriedOrderCode
      ? "Nguoi dung dang tra cuu theo ma don cu the. Neu khong tim thay thi thong bao ro khong ton tai ma nay trong lich su cua ho."
      : "Nguoi dung dang tra cuu lich su don hang tong quan.",
    "Neu co don: tom tat 1-3 don moi nhat theo trang thai va tong tien.",
    "Neu khong co don: thong bao lich su trong va goi y dat hang.",
    `Cau hoi nguoi dung: ${message}`,
    queriedOrderCode ? `Ma don nguoi dung nhap: ${queriedOrderCode}` : "Ma don nguoi dung nhap: khong co",
    "Du lieu don hang:",
    ordersContext
  ].join("\n");

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 220
        }
      },
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text || typeof text !== "string") return null;
    return text.trim();
  } catch (error) {
    return null;
  }
};

const buildOrderFallbackReply = (orders, queriedOrderCode) => {
  if (queriedOrderCode && (!orders || orders.length === 0)) {
    return `Mình chưa tìm thấy đơn hàng có mã ${queriedOrderCode} trong tài khoản của bạn.`;
  }

  if (!orders || orders.length === 0) {
    return "Bạn chưa có đơn hàng nào. Bạn muốn mình gợi ý sản phẩm phù hợp để đặt đơn mới không?";
  }

  const blocks = orders.slice(0, 3).map((order, index) => formatSingleOrderBlock(order, index));
  return `Mình đã tìm thấy ${orders.length} đơn của bạn:\n\n${blocks.join("\n\n----------------\n\n")}`;
};

const isGreeting = (message) => containsKeyword(normalizeText(message), GREETING_KEYWORDS);

const removePricePhrase = (text) => {
  const priceRegex = /(\d+(?:[.,]\d+)?)\s*(trieu|tr|cu|k|nghin|ngan|dong|vnd|vnđ)/g;
  return text.replace(priceRegex, " ");
};

const detectCanonicalValue = (normalizedText, aliasMap) => {
  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    if (aliases.some((alias) => normalizedText.includes(normalizeText(alias)))) {
      return canonical;
    }
  }
  return "";
};

const aliasTokenSet = (aliasMap) => {
  const tokens = new Set();
  for (const aliases of Object.values(aliasMap)) {
    aliases.forEach((alias) => {
      normalizeText(alias)
        .split(" ")
        .filter(Boolean)
        .forEach((token) => tokens.add(token));
    });
  }
  return tokens;
};

const CATEGORY_ALIAS_TOKENS = aliasTokenSet(CATEGORY_ALIASES);
const BRAND_ALIAS_TOKENS = aliasTokenSet(BRAND_ALIASES);

const extractSearchSignals = (message) => {
  const original = normalizeWithDiacritics(removePricePhrase(message));
  const normalized = normalizeText(removePricePhrase(message));
  const price = extractPriceVnd(message);
  const category = detectCanonicalValue(normalized, CATEGORY_ALIASES);
  const brand = detectCanonicalValue(normalized, BRAND_ALIASES);
  const requireInStock = containsKeyword(normalized, IN_STOCK_KEYWORDS);
  const allowApproximateBudget = containsKeyword(normalized, APPROXIMATE_BUDGET_KEYWORDS);

  const originalTokens = original.split(" ").filter(Boolean);
  const normalizedTokens = normalized.split(" ").filter(Boolean);
  const freeTextTokens = [];

  for (let i = 0; i < normalizedTokens.length; i += 1) {
    const token = normalizedTokens[i];
    if (STOP_WORDS.has(token)) continue;
    if (CATEGORY_ALIAS_TOKENS.has(token)) continue;
    if (BRAND_ALIAS_TOKENS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;
    freeTextTokens.push({
      normalized: token,
      original: originalTokens[i] || token
    });
  }

  const deduped = [];
  const seen = new Set();
  freeTextTokens.forEach((token) => {
    if (seen.has(token.normalized)) return;
    seen.add(token.normalized);
    deduped.push(token);
  });

  return {
    normalizedMessage: normalized,
    originalMessage: original,
    category,
    brand,
    price,
    requireInStock,
    allowApproximateBudget,
    tokens: deduped,
    keywordOriginal: deduped.map((item) => item.original).join(" ").trim(),
    keywordNormalized: deduped.map((item) => item.normalized).join(" ").trim()
  };
};

const normalizeProductFields = (product) => {
  const name = normalizeText(product?.name || "");
  const category = normalizeText(product?.category || "");
  const brand = normalizeText(product?.brand || "");
  const description = normalizeText(product?.description || "");
  return {
    name,
    category,
    brand,
    description,
    searchable: `${name} ${category} ${brand} ${description}`.trim()
  };
};

const scoreProduct = (product, signals) => {
  const fields = normalizeProductFields(product);
  let score = 0;

  if (signals.brand) {
    if (fields.brand === signals.brand || fields.name.includes(signals.brand)) {
      score += 10;
    } else {
      return -1;
    }
  }

  if (signals.category) {
    if (fields.category.includes(signals.category) || fields.searchable.includes(signals.category)) {
      score += 8;
    } else {
      return -1;
    }
  }

  signals.tokens.forEach((token) => {
    if (fields.name.includes(token.normalized)) {
      score += 6;
    } else if (fields.searchable.includes(token.normalized)) {
      score += 3;
    }
  });

  if (signals.keywordNormalized && fields.name.includes(signals.keywordNormalized)) {
    score += 5;
  }

  if (signals.price) {
    const budget = Number(signals.price);
    const productPrice = Number(product?.price || 0);
    if (productPrice <= budget) {
      score += 4;
    } else if (signals.allowApproximateBudget && productPrice <= budget * 1.15) {
      score += 1;
    } else if (!signals.allowApproximateBudget) {
      score -= 4;
    }

    const gapRatio = Math.abs(productPrice - budget) / Math.max(budget, 1);
    score += Math.max(0, 3 - gapRatio * 6);
  }

  if (Number(product?.stock || 0) > 0) {
    score += 1.5;
  } else if (signals.requireInStock) {
    score -= 6;
  }

  if (!signals.brand && !signals.category && signals.tokens.length === 0) {
    score += 0.5;
  }

  return score;
};

const buildProductQuery = (signals, widenBudget = false) => {
  const query = {};

  if (signals.requireInStock) {
    query.stock = { $gt: 0 };
  }

  if (signals.price) {
    const upper = widenBudget || signals.allowApproximateBudget
      ? Math.round(Number(signals.price) * 1.15)
      : Number(signals.price);
    query.price = { $lte: upper };
  }

  return query;
};

const findProductsBySignals = async (signals) => {
  const query = buildProductQuery(signals, false);
  let candidates = await Product.find(query).sort({ stock: -1, createdAt: -1 }).limit(80).lean();

  let ranked = candidates
    .map((product) => ({ product, score: scoreProduct(product, signals) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.product);

  if (ranked.length === 0 && signals.price) {
    candidates = await Product.find(buildProductQuery(signals, true)).sort({ stock: -1, createdAt: -1 }).limit(120).lean();
    ranked = candidates
      .map((product) => ({ product, score: scoreProduct(product, { ...signals, allowApproximateBudget: true }) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.product);
  }

  return ranked;
};

const buildSearchFallbackReply = (signals, products) => {
  if (!products || products.length === 0) {
    const parts = [];
    if (signals.category) parts.push(`danh mục ${signals.category}`);
    if (signals.brand) parts.push(`hãng ${signals.brand}`);
    if (signals.price) parts.push(`ngân sách khoảng ${formatPrice(signals.price)}`);
    const summary = parts.length > 0 ? ` theo ${parts.join(", ")}` : "";
    return `Hiện tại mình chưa tìm thấy sản phẩm phù hợp${summary}. Bạn thử đổi tên sản phẩm, hãng hoặc tăng ngân sách một chút nhé.`;
  }

  const summary = [];
  if (signals.category) summary.push(`dòng ${signals.category}`);
  if (signals.brand) summary.push(`hãng ${signals.brand}`);
  if (signals.price) summary.push(`tầm ${formatPrice(signals.price)}`);
  const suffix = summary.length > 0 ? ` cho nhu cầu ${summary.join(", ")}` : "";
  return `${pickReply()} Mình ưu tiên các lựa chọn${suffix}.`;
};

const persistChatLog = ({ user_id, message, response, intent }) => {
  ChatLog.create({
    user_id,
    message,
    response,
    intent
  }).catch(() => {});
};

const handleChat = async ({ user_id, actor_user_id, message }) => {
  const effectiveUserId = actor_user_id || user_id || "guest";

  if (!message) {
    return { status: 400, body: { message: "message is required" } };
  }

  if (isOrderLookupIntent(message)) {
    const lookupUserId = actor_user_id || user_id;
    const queriedOrderCode = extractOrderCode(message);

    if (!lookupUserId) {
      const reply = "Bạn vui lòng đăng nhập để mình tra cứu đơn hàng của bạn nhé.";
      persistChatLog({
        user_id: effectiveUserId,
        message,
        response: reply,
        intent: "order_lookup"
      });

      return { status: 200, body: { reply, products: [], orders: [] } };
    }

    const orderResult = await fetchMyOrders(lookupUserId);
    if (!orderResult.ok) {
      const reply = "Hiện tại mình chưa tra cứu được đơn hàng. Bạn thử lại sau giúp mình nhé.";
      persistChatLog({
        user_id: effectiveUserId,
        message,
        response: reply,
        intent: "order_lookup"
      });

      return { status: 200, body: { reply, products: [], orders: [] } };
    }

    const allOrders = orderResult.orders || [];
    const orders = queriedOrderCode
      ? allOrders.filter((order) => {
          const id = String(order?._id || order?.id || "");
          return id.toLowerCase() === String(queriedOrderCode).toLowerCase();
        })
      : allOrders;

    const reply =
      (await generateGeminiOrderReply({
        message,
        orders,
        queriedOrderCode
      })) || buildOrderFallbackReply(orders, queriedOrderCode);

    persistChatLog({
      user_id: effectiveUserId,
      message,
      response: reply,
      intent: "order_lookup"
    });

    return { status: 200, body: { reply, products: [], orders: orders.slice(0, 5) } };
  }

  if (isGreeting(message)) {
    const reply = "Chào bạn! Bạn cần tư vấn sản phẩm nào? Bạn có thể nói tên máy, hãng hoặc tầm giá.";
    persistChatLog({
      user_id: effectiveUserId,
      message,
      response: reply,
      intent: "greeting"
    });

    return { status: 200, body: { reply, products: [] } };
  }

  const signals = extractSearchSignals(message);
  if (!signals.category && !signals.brand && !signals.keywordOriginal && !signals.keywordNormalized && !signals.price) {
    const reply = "Bạn đang tìm sản phẩm gì? Ví dụ: điện thoại Samsung dưới 10 triệu hoặc iPhone còn hàng.";
    persistChatLog({
      user_id: effectiveUserId,
      message,
      response: reply,
      intent: "unknown"
    });

    return { status: 200, body: { reply, products: [] } };
  }

  const products = await findProductsBySignals(signals);
  const fallbackReply = buildSearchFallbackReply(signals, products);
  const reply =
    (await generateGeminiReply({
      message,
      products,
      price: signals.price
    })) || fallbackReply;

  persistChatLog({
    user_id: effectiveUserId,
    message,
    response: reply,
    intent: "search"
  });

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
