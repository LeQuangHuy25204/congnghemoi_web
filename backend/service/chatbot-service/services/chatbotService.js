const axios = require("axios");
const ChatLog = require("../models/ChatLog");
const createProductDbConnection = require("../config/productDb");
const productSchema = require("../models/Product");
const { normalizeText, extractPriceVnd } = require("../utils/text");

const productDb = createProductDbConnection();
const Product = productDb.model("Product", productSchema, "products");
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:5004";

const replies = [
  "Mình tìm được các sản phẩm phù hợp:",
  "Bạn tham khảo các sản phẩm sau nhé:",
  "Dưới đây là những lựa chọn phù hợp:"
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
  "tinh trang don",
  "trang thai don",
  "lich su mua",
  "order",
  "orders",
  "my order"
];

const STATUS_LABELS = {
  pending: "dang cho xac nhan",
  confirmed: "da xac nhan",
  shipping: "dang giao",
  completed: "da hoan thanh",
  cancelled: "da huy"
};

const formatPrice = (value) => {
  if (typeof value !== "number") return "N/A";
  return `${value.toLocaleString("vi-VN")} VND`;
};

const getOrderStatusLabel = (status) => STATUS_LABELS[status] || status || "khong ro";

const isOrderLookupIntent = (message) => {
  const text = normalizeText(message);
  return ORDER_INTENT_KEYWORDS.some((keyword) => text.includes(keyword));
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

  const lines = orders.slice(0, 3).map((order, index) => {
    const orderId = order?._id || order?.id || "N/A";
    const status = getOrderStatusLabel(order?.status);
    const total = formatPrice(order?.total_price || order?.total || 0);
    return `${index + 1}. Đơn ${orderId}: ${status}, tổng ${total}`;
  });

  return `Mình đã tìm thấy ${orders.length} đơn của bạn.\n${lines.join("\n")}`;
};

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
      ChatLog.create({
        user_id: effectiveUserId,
        message,
        response: reply,
        intent: "order_lookup"
      }).catch(() => {});

      return { status: 200, body: { reply, products: [], orders: [] } };
    }

    const orderResult = await fetchMyOrders(lookupUserId);
    if (!orderResult.ok) {
      const reply = "Hiện tại mình chưa tra cứu được đơn hàng. Bạn thử lại sau giúp mình nhé.";
      ChatLog.create({
        user_id: effectiveUserId,
        message,
        response: reply,
        intent: "order_lookup"
      }).catch(() => {});

      return { status: 200, body: { reply, products: [], orders: [] } };
    }

    const allOrders = orderResult.orders || [];
    const orders = queriedOrderCode
      ? allOrders.filter((order) => {
          const id = String(order?._id || order?.id || "");
          return id.toLowerCase() === String(queriedOrderCode).toLowerCase();
        })
      : allOrders;

    const fallbackReply = buildOrderFallbackReply(orders, queriedOrderCode);
    const reply =
      (await generateGeminiOrderReply({
        message,
        orders,
        queriedOrderCode
      })) || fallbackReply;

    ChatLog.create({
      user_id: effectiveUserId,
      message,
      response: reply,
      intent: "order_lookup"
    }).catch(() => {});

    return { status: 200, body: { reply, products: [], orders: orders.slice(0, 5) } };
  }

  if (isGreeting(message)) {
    const reply = "Chào bạn! Bạn cần tư vấn sản phẩm nào?";
    ChatLog.create({
      user_id: effectiveUserId,
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
      user_id: effectiveUserId,
      message,
      response: reply,
      intent: "unknown"
    }).catch(() => {});

    return { status: 200, body: { reply, products: [] } };
  }

  const price = extractPriceVnd(message);
  const products = await searchProductsByName({ keywordOriginal, keywordNormalized, price });

  if (!products || products.length === 0) {
    const fallbackReply = "Hiện tại mình chưa tìm thấy sản phẩm phù hợp 😅";
    const reply =
      (await generateGeminiReply({
        message,
        products,
        price
      })) || fallbackReply;

    ChatLog.create({
      user_id: effectiveUserId,
      message,
      response: reply,
      intent: "search"
    }).catch(() => {});

    return { status: 200, body: { reply, products: [] } };
  }

  const fallbackReply = pickReply();
  const reply =
    (await generateGeminiReply({
      message,
      products,
      price
    })) || fallbackReply;

  ChatLog.create({
    user_id: effectiveUserId,
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

