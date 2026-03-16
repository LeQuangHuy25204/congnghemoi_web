const axios = require("axios");
const OpenAI = require("openai");
const ChatLog = require("../models/ChatLog");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const productServiceUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:5002";
const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:5004";
const supportServiceUrl = process.env.SUPPORT_SERVICE_URL || "http://localhost:5007";

const detectIntent = (message) => {
  const text = message.toLowerCase();

  if (
    text.includes("product") ||
    text.includes("san pham") ||
    text.includes("laptop") ||
    text.includes("dien thoai") ||
    text.includes("gia")
  ) {
    return "product";
  }

  if (
    text.includes("order") ||
    text.includes("don hang") ||
    text.includes("tracking") ||
    text.includes("trang thai")
  ) {
    return "order";
  }

  return "unknown";
};

const askOpenAI = async (message, context) => {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const isPlaceholder =
    apiKey === "" ||
    apiKey === "your_openai_api_key" ||
    apiKey.toLowerCase().includes("replace_me") ||
    apiKey.toLowerCase().includes("your_");

  if (isPlaceholder) {
    return "Chatbot is running in demo mode. Set a valid OPENAI_API_KEY for real AI responses.";
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an e-commerce customer support assistant for phones, laptops, and electronic devices. Provide concise, clear, friendly answers based on context data."
      },
      {
        role: "user",
        content: `User message: ${message}\nContext: ${JSON.stringify(context)}`
      }
    ],
    temperature: 0.4
  });

  return completion.choices?.[0]?.message?.content || "I could not generate a response at this moment.";
};

const handleChat = async ({ user_id, message }) => {
  if (!message) {
    return { status: 400, body: { message: "message is required" } };
  }

  const intent = detectIntent(message);
  const context = {};
  let answer = "";

  if (intent === "product") {
    const productResponse = await axios.get(`${productServiceUrl}/api/products`, {
      params: { q: message }
    });
    context.products = productResponse.data.slice(0, 5);
    answer = await askOpenAI(message, context);
  } else if (intent === "order") {
    if (!user_id) {
      return { status: 400, body: { message: "user_id is required for order tracking" } };
    }

    const orderResponse = await axios.get(`${orderServiceUrl}/api/orders/${user_id}`);
    context.orders = orderResponse.data;
    answer = await askOpenAI(message, context);
  } else {
    if (user_id) {
      await axios.post(`${supportServiceUrl}/api/support/ticket`, {
        user_id,
        title: "Chatbot escalation",
        message,
        status: "open"
      });
    }

    answer = "I am not fully sure about this request. I created a support ticket so our team can assist you.";
  }

  await ChatLog.create({
    user_id: user_id || "guest",
    message,
    response: answer,
    intent
  });

  return {
    status: 200,
    body: {
      intent,
      context,
      response: answer
    }
  };
};

module.exports = {
  handleChat
};
