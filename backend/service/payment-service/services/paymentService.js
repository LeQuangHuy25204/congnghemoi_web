const crypto = require("crypto");
const mongoose = require("mongoose");
const {
  Payment,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} = require("../models/Payment");

const PAYOS_BASE_URL = process.env.PAYOS_BASE_URL || "https://api-merchant.payos.vn";
const VIETQR_BASE_URL = process.env.VIETQR_BASE_URL || "https://api.vietqr.io";
const VIETQR_IMAGE_BASE_URL = process.env.VIETQR_IMAGE_BASE_URL || "https://img.vietqr.io/image";

const normalizeText = (value) => String(value || "").trim();
const normalizeStatus = (value) => normalizeText(value).toLowerCase();
const toPositiveInt = (value) => Math.round(Number(value) || 0);
const isAdmin = (role) => normalizeText(role).toLowerCase() === "admin";

const sanitizeDescription = (value) => {
  const normalized = normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (normalized || "THANH TOAN").slice(0, 25);
};

const resolveMethod = (method) => {
  const normalized = normalizeText(method).toLowerCase();
  if (!normalized) return "";
  if (normalized === "payos" || normalized === "momo") return "payos";
  if (normalized === "vietqr" || normalized === "bank") return "vietqr";
  if (normalized === "cod") return "cod";
  return normalized;
};

const resolveProviderByMethod = (method) => {
  if (method === "payos") return "payos";
  if (method === "vietqr") return "vietqr";
  if (method === "cod") return "cod";
  return "manual";
};

const buildDefaultDescription = (orderId) => sanitizeDescription(`DH ${String(orderId || "").slice(-12)}`);

const nextOrderCode = () => Number(String(Date.now()).slice(-9));

const createPayosSignature = ({ amount, cancelUrl, description, orderCode, returnUrl }, checksumKey) => {
  const rawSignature = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return crypto.createHmac("sha256", checksumKey).update(rawSignature).digest("hex");
};

const buildVietQrImageUrl = ({ bankId, accountNo, template, amount, addInfo, accountName }) => {
  const query = new URLSearchParams();
  if (amount > 0) query.set("amount", String(amount));
  if (addInfo) query.set("addInfo", addInfo);
  if (accountName) query.set("accountName", accountName);
  return `${VIETQR_IMAGE_BASE_URL}/${bankId}-${accountNo}-${template}.png?${query.toString()}`;
};

const validateVietQrConfig = () => {
  const requiredConfig = [
    { key: "VIETQR_BANK_ID", value: normalizeText(process.env.VIETQR_BANK_ID) },
    { key: "VIETQR_ACCOUNT_NO", value: normalizeText(process.env.VIETQR_ACCOUNT_NO) },
    { key: "VIETQR_ACCOUNT_NAME", value: normalizeText(process.env.VIETQR_ACCOUNT_NAME) }
  ];

  const missingKeys = requiredConfig.filter((item) => !item.value).map((item) => item.key);
  if (missingKeys.length === 0) {
    return { ok: true, missingKeys: [] };
  }

  return {
    ok: false,
    missingKeys,
    message: `Thiếu cấu hình VietQR: ${missingKeys.join(", ")}`
  };
};

const callJsonApi = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.desc || data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

const createPayosPaymentLink = async ({ orderCode, amount, description, items, buyerName, buyerEmail, buyerPhone }) => {
  const clientId = normalizeText(process.env.PAYOS_CLIENT_ID);
  const apiKey = normalizeText(process.env.PAYOS_API_KEY);
  const checksumKey = normalizeText(process.env.PAYOS_CHECKSUM_KEY);
  const returnUrl = normalizeText(process.env.PAYOS_RETURN_URL);
  const cancelUrl = normalizeText(process.env.PAYOS_CANCEL_URL);

  if (!clientId || !apiKey || !checksumKey || !returnUrl || !cancelUrl) {
    return {
      enabled: false,
      message: "PayOS credentials are not configured"
    };
  }

  const payload = {
    orderCode,
    amount,
    description,
    buyerName: normalizeText(buyerName) || undefined,
    buyerEmail: normalizeText(buyerEmail) || undefined,
    buyerPhone: normalizeText(buyerPhone) || undefined,
    items: Array.isArray(items) ? items : [],
    cancelUrl,
    returnUrl
  };

  payload.signature = createPayosSignature(payload, checksumKey);

  const data = await callJsonApi(`${PAYOS_BASE_URL}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey
    },
    body: JSON.stringify(payload)
  });

  return {
    enabled: true,
    raw: data,
    data: data?.data || {}
  };
};

const getPayosPaymentLink = async (paymentRef) => {
  const clientId = normalizeText(process.env.PAYOS_CLIENT_ID);
  const apiKey = normalizeText(process.env.PAYOS_API_KEY);
  if (!clientId || !apiKey) {
    return { enabled: false, message: "PayOS credentials are not configured" };
  }

  const data = await callJsonApi(`${PAYOS_BASE_URL}/v2/payment-requests/${encodeURIComponent(paymentRef)}`, {
    method: "GET",
    headers: {
      "x-client-id": clientId,
      "x-api-key": apiKey
    }
  });

  return {
    enabled: true,
    raw: data,
    data: data?.data || {}
  };
};

const generateVietQr = async ({ amount, description }) => {
  const bankId = normalizeText(process.env.VIETQR_BANK_ID);
  const accountNo = normalizeText(process.env.VIETQR_ACCOUNT_NO);
  const accountName = normalizeText(process.env.VIETQR_ACCOUNT_NAME);
  const template = normalizeText(process.env.VIETQR_TEMPLATE) || "compact2";
  const addInfo = sanitizeDescription(description);

  const configValidation = validateVietQrConfig();
  if (!configValidation.ok) {
    return {
      enabled: false,
      message: configValidation.message,
      missingKeys: configValidation.missingKeys
    };
  }

  const imageUrl = buildVietQrImageUrl({
    bankId,
    accountNo,
    template,
    amount,
    addInfo,
    accountName
  });

  const clientId = normalizeText(process.env.VIETQR_CLIENT_ID);
  const apiKey = normalizeText(process.env.VIETQR_API_KEY);

  if (!clientId || !apiKey) {
    return {
      enabled: true,
      mode: "quick-link",
      data: {
        qrImageURL: imageUrl,
        accountName,
        accountNo,
        acqId: bankId,
        addInfo
      }
    };
  }

  const data = await callJsonApi(`${VIETQR_BASE_URL}/v2/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey
    },
    body: JSON.stringify({
      accountNo,
      accountName: accountName || undefined,
      acqId: bankId,
      amount,
      addInfo,
      template
    })
  });

  return {
    enabled: true,
    mode: "api",
    raw: data,
    data: {
      ...(data?.data || {}),
      qrImageURL: data?.data?.qrDataURL ? "" : imageUrl
    }
  };
};

const syncPayosStatus = async (payment) => {
  const paymentRef = payment.payment_link_id || payment.order_code;
  if (!paymentRef) return payment;

  const payos = await getPayosPaymentLink(paymentRef);
  if (!payos.enabled) return payment;

  const remoteStatus = normalizeText(payos.data?.status).toLowerCase();
  const update = {
    payos_data: payos.raw || {},
    payment_link_id: payos.data?.id || payment.payment_link_id,
    checkout_url: payos.data?.checkoutUrl || payment.checkout_url
  };

  if (remoteStatus === "paid") update.status = "paid";
  else if (remoteStatus === "cancelled") update.status = "cancelled";
  else if (remoteStatus === "processing") update.status = "processing";
  else if (remoteStatus === "pending") update.status = "pending";

  const updated = await Payment.findByIdAndUpdate(payment._id, update, { new: true });
  return updated || payment;
};

const ensurePaymentAccess = (payment, actorUserId, actorRole) => {
  if (!payment) {
    return { status: 404, body: { message: "Payment not found" } };
  }

  if (isAdmin(actorRole) || payment.user_id === actorUserId) {
    return null;
  }

  return { status: 403, body: { message: "Forbidden" } };
};

const serializePaymentResponse = (payment) => ({
  _id: payment._id,
  order_id: payment.order_id,
  user_id: payment.user_id,
  amount: payment.amount,
  method: payment.method,
  provider: payment.provider,
  status: payment.status,
  description: payment.description,
  order_code: payment.order_code,
  payment_link_id: payment.payment_link_id,
  checkout_url: payment.checkout_url,
  qr_code: payment.qr_code,
  qr_data_url: payment.qr_data_url,
  qr_image_url: payment.qr_image_url,
  account_name: payment.account_name,
  account_no: payment.account_no,
  acq_id: payment.acq_id,
  metadata: payment.metadata,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt
});

const createPayment = async (payload, actorUserId, actorRole) => {
  const orderId = normalizeText(payload?.order_id);
  const ownerUserId = normalizeText(actorUserId || payload?.user_id);
  const amount = toPositiveInt(payload?.amount);
  const method = resolveMethod(payload?.method);
  const status = normalizeStatus(payload?.status) || (method === "cod" ? "pending" : "processing");

  if (!orderId || !ownerUserId || amount <= 0 || !method) {
    return { status: 400, body: { message: "order_id, user_id, amount, method are required" } };
  }

  if (!PAYMENT_METHODS.includes(method)) {
    return { status: 400, body: { message: "Invalid payment method" } };
  }

  if (!PAYMENT_STATUSES.includes(status)) {
    return { status: 400, body: { message: "Invalid payment status" } };
  }

  if (!isAdmin(actorRole) && normalizeText(payload?.user_id) && normalizeText(payload.user_id) !== ownerUserId) {
    return { status: 403, body: { message: "Cannot create payment for another user" } };
  }

  const provider = resolveProviderByMethod(method);
  const description = sanitizeDescription(payload?.description || buildDefaultDescription(orderId));
  const orderCode = Number.isInteger(payload?.order_code) ? payload.order_code : nextOrderCode();

  const baseUpdate = {
    order_id: orderId,
    user_id: ownerUserId,
    amount,
    method,
    provider,
    status: method === "cod" ? status : "processing",
    description,
    order_code: method === "cod" ? undefined : orderCode,
    metadata: payload?.metadata && typeof payload.metadata === "object" ? payload.metadata : {}
  };

  let integrationMessage = "";
  let integrationMode = "";

  if (provider === "payos") {
    const payos = await createPayosPaymentLink({
      orderCode,
      amount,
      description,
      items: Array.isArray(payload?.items) ? payload.items : [],
      buyerName: payload?.buyer_name,
      buyerEmail: payload?.buyer_email,
      buyerPhone: payload?.buyer_phone
    });

    if (!payos.enabled) {
      integrationMessage = payos.message;
      baseUpdate.status = "pending";
      baseUpdate.metadata = { ...baseUpdate.metadata, integration_ready: false, integration_message: payos.message };
    } else {
      integrationMode = "payos";
      baseUpdate.payment_link_id = normalizeText(payos.data?.paymentLinkId);
      baseUpdate.checkout_url = normalizeText(payos.data?.checkoutUrl);
      baseUpdate.qr_code = normalizeText(payos.data?.qrCode);
      baseUpdate.payos_data = payos.raw || {};
      baseUpdate.status = normalizeStatus(payos.data?.status) || "pending";
      baseUpdate.account_no = normalizeText(payos.data?.accountNumber);
      baseUpdate.account_name = normalizeText(payos.data?.accountName);
      baseUpdate.acq_id = normalizeText(payos.data?.bin);
    }
  }

  if (provider === "vietqr") {
    const vietqr = await generateVietQr({ amount, description });
    if (!vietqr.enabled) {
      integrationMessage = vietqr.message;
      baseUpdate.metadata = { ...baseUpdate.metadata, integration_ready: false, integration_message: vietqr.message };
      baseUpdate.status = "pending";
    } else {
      integrationMode = `vietqr:${vietqr.mode}`;
      baseUpdate.status = "pending";
      baseUpdate.qr_code = normalizeText(vietqr.data?.qrCode);
      baseUpdate.qr_data_url = normalizeText(vietqr.data?.qrDataURL);
      baseUpdate.qr_image_url = normalizeText(vietqr.data?.qrImageURL);
      baseUpdate.account_name = normalizeText(vietqr.data?.accountName || process.env.VIETQR_ACCOUNT_NAME);
      baseUpdate.account_no = normalizeText(vietqr.data?.accountNo || process.env.VIETQR_ACCOUNT_NO);
      baseUpdate.acq_id = normalizeText(vietqr.data?.acqId || process.env.VIETQR_BANK_ID);
      baseUpdate.vietqr_data = vietqr.raw || vietqr.data || {};
    }
  }

  const payment = await Payment.findOneAndUpdate(
    { order_id: orderId, user_id: ownerUserId },
    { $set: baseUpdate },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  return {
    status: 201,
    body: {
      payment: serializePaymentResponse(payment),
      integration: {
        provider,
        mode: integrationMode || provider,
        message: integrationMessage || null
      }
    }
  };
};

const listPayments = async ({ actorUserId, actorRole, query }) => {
  const page = Math.max(Number.parseInt(query?.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query?.limit, 10) || 20, 1), 100);
  const filter = {};

  if (!isAdmin(actorRole)) {
    if (!actorUserId) {
      return { status: 401, body: { message: "Unauthorized" } };
    }
    filter.user_id = actorUserId;
  } else if (normalizeText(query?.user_id)) {
    filter.user_id = normalizeText(query.user_id);
  }

  const status = normalizeStatus(query?.status);
  if (status) {
    if (!PAYMENT_STATUSES.includes(status)) {
      return { status: 400, body: { message: "Invalid payment status filter" } };
    }
    filter.status = status;
  }

  const provider = normalizeText(query?.provider).toLowerCase();
  if (provider) {
    filter.provider = provider;
  }

  const orderId = normalizeText(query?.order_id);
  if (orderId) {
    filter.order_id = orderId;
  }

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(filter)
  ]);

  return {
    status: 200,
    body: {
      items: items.map(serializePaymentResponse),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    }
  };
};

const getPaymentById = async (id, actorUserId, actorRole) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { status: 400, body: { message: "Invalid payment id" } };
  }

  let payment = await Payment.findById(id);
  const accessError = ensurePaymentAccess(payment, actorUserId, actorRole);
  if (accessError) return accessError;

  if (payment.provider === "payos") {
    payment = await syncPayosStatus(payment);
  }

  return { status: 200, body: serializePaymentResponse(payment) };
};

const updatePaymentStatus = async (id, nextStatus, actorRole) => {
  if (!isAdmin(actorRole)) {
    return { status: 403, body: { message: "Admin role is required" } };
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { status: 400, body: { message: "Invalid payment id" } };
  }

  const normalizedStatus = normalizeStatus(nextStatus);
  if (!PAYMENT_STATUSES.includes(normalizedStatus)) {
    return { status: 400, body: { message: "Invalid payment status" } };
  }

  const payment = await Payment.findByIdAndUpdate(
    id,
    { status: normalizedStatus },
    { new: true, runValidators: true }
  );

  if (!payment) {
    return { status: 404, body: { message: "Payment not found" } };
  }

  return { status: 200, body: serializePaymentResponse(payment) };
};

const getPaymentVietQr = async (id, actorUserId, actorRole) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { status: 400, body: { message: "Invalid payment id" } };
  }

  const payment = await Payment.findById(id);
  const accessError = ensurePaymentAccess(payment, actorUserId, actorRole);
  if (accessError) return accessError;

  const description = payment.description || buildDefaultDescription(payment.order_id);
  const vietqr = await generateVietQr({ amount: payment.amount, description });
  if (!vietqr.enabled) {
    return { status: 400, body: { message: vietqr.message } };
  }

  const updated = await Payment.findByIdAndUpdate(
    payment._id,
    {
      qr_code: normalizeText(vietqr.data?.qrCode),
      qr_data_url: normalizeText(vietqr.data?.qrDataURL),
      qr_image_url: normalizeText(vietqr.data?.qrImageURL),
      account_name: normalizeText(vietqr.data?.accountName || process.env.VIETQR_ACCOUNT_NAME),
      account_no: normalizeText(vietqr.data?.accountNo || process.env.VIETQR_ACCOUNT_NO),
      acq_id: normalizeText(vietqr.data?.acqId || process.env.VIETQR_BANK_ID),
      vietqr_data: vietqr.raw || vietqr.data || {}
    },
    { new: true }
  );

  return {
    status: 200,
    body: {
      payment: serializePaymentResponse(updated || payment),
      qr: {
        qr_code: normalizeText(vietqr.data?.qrCode),
        qr_data_url: normalizeText(vietqr.data?.qrDataURL),
        qr_image_url: normalizeText(vietqr.data?.qrImageURL),
        account_name: normalizeText(vietqr.data?.accountName || process.env.VIETQR_ACCOUNT_NAME),
        account_no: normalizeText(vietqr.data?.accountNo || process.env.VIETQR_ACCOUNT_NO),
        acq_id: normalizeText(vietqr.data?.acqId || process.env.VIETQR_BANK_ID)
      }
    }
  };
};

module.exports = {
  createPayment,
  listPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentVietQr
};
