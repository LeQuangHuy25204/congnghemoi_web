const crypto = require("crypto");
const mongoose = require("mongoose");
const { Payment, PAYMENT_METHODS, PAYMENT_STATUSES } = require("../models/Payment");

const PAYOS_BASE_URL = process.env.PAYOS_BASE_URL || "https://api-merchant.payos.vn";
const SEPAY_API_BASE_URL = process.env.SEPAY_API_BASE_URL || "https://userapi.sepay.vn/v2";
const SEPAY_BANK_SHORT_NAME = (process.env.SEPAY_BANK_SHORT_NAME || "BIDV").trim();
const SEPAY_BANK_BIN = (process.env.SEPAY_BANK_BIN || "970418").trim();
const SEPAY_POLL_LOOKBACK_MINUTES = Math.max(Number.parseInt(process.env.SEPAY_POLL_LOOKBACK_MINUTES || "1440", 10) || 1440, 5);
const VIETQR_IMAGE_BASE_URL = process.env.VIETQR_IMAGE_BASE_URL || "https://img.vietqr.io/image";

const normalizeText = (value) => String(value || "").trim();
const normalizeStatus = (value) => normalizeText(value).toLowerCase();
const toPositiveInt = (value) => Math.round(Number(value) || 0);
const VIETQR_TEMPLATE = normalizeText(process.env.VIETQR_TEMPLATE) || "compact2";
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
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

const normalizeLooseText = (value) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const resolveMethod = (method) => {
  const normalized = normalizeText(method).toLowerCase();
  if (!normalized) return "";
  if (normalized === "payos" || normalized === "momo") return "payos";
  if (normalized === "sepay" || normalized === "vietqr" || normalized === "bank") return "sepay";
  if (normalized === "cod") return "cod";
  return normalized;
};

const resolveProviderByMethod = (method) => {
  if (method === "payos") return "payos";
  if (method === "sepay") return "sepay";
  if (method === "cod") return "cod";
  return "manual";
};

const buildDefaultDescription = (orderId) => sanitizeDescription(`DH ${String(orderId || "").slice(-12)}`);
const nextOrderCode = () => Number(String(Date.now()).slice(-9));

const createPayosSignature = ({ amount, cancelUrl, description, orderCode, returnUrl }, checksumKey) => {
  const rawSignature = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return crypto.createHmac("sha256", checksumKey).update(rawSignature).digest("hex");
};

const buildVietQrImageUrl = ({ bankId, accountNo, amount, addInfo, accountName, template = VIETQR_TEMPLATE }) => {
  const normalizedBankId = normalizeText(bankId);
  const normalizedAccountNo = normalizeText(accountNo);
  if (!normalizedBankId || !normalizedAccountNo) return "";

  const query = new URLSearchParams();
  if (toPositiveInt(amount) > 0) query.set("amount", String(toPositiveInt(amount)));
  if (normalizeText(addInfo)) query.set("addInfo", normalizeText(addInfo));
  if (normalizeText(accountName)) query.set("accountName", normalizeText(accountName));

  const queryString = query.toString();
  return `${VIETQR_IMAGE_BASE_URL}/${encodeURIComponent(normalizedBankId)}-${encodeURIComponent(
    normalizedAccountNo
  )}-${encodeURIComponent(template)}.png${queryString ? `?${queryString}` : ""}`;
};

const toDateTimeParam = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
};

const parseSepayDate = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parsed = new Date(normalized.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const callJsonApi = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.desc || data?.message || data?.error || data?.messages?.error || `Request failed with status ${response.status}`
    );
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
    return { enabled: false, message: "PayOS credentials are not configured" };
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

const getSepayToken = () => normalizeText(process.env.SEPAY_API_TOKEN);
const getSepayManualAccountConfig = () => ({
  accountNo: normalizeText(process.env.SEPAY_ACCOUNT_NUMBER),
  accountName: normalizeText(process.env.SEPAY_ACCOUNT_NAME),
  bankBin: normalizeText(process.env.SEPAY_BANK_BIN || SEPAY_BANK_BIN),
  bankShortName: normalizeText(process.env.SEPAY_BANK_SHORT_NAME || SEPAY_BANK_SHORT_NAME)
});
const hasSepayManualAccountConfig = (config) => Boolean(config?.accountNo && config?.accountName && config?.bankBin);
const buildManualSepayBankAccount = (config) => ({
  enabled: true,
  data: {
    id: "",
    account_holder_name: config.accountName,
    account_number: config.accountNo,
    bank_bin: config.bankBin,
    bank_short_name: config.bankShortName,
    bank_full_name: config.bankShortName
  },
  raw: { mode: "manual" }
});

const callSepayApi = async (pathname, query = {}) => {
  const apiToken = getSepayToken();
  if (!apiToken) {
    return { enabled: false, message: "SEPAY_API_TOKEN is not configured" };
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const url = `${SEPAY_API_BASE_URL}${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  const data = await callJsonApi(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`
    }
  });

  return { enabled: true, raw: data, data: data?.data };
};

const validateSepayConfig = () => {
  const apiToken = getSepayToken();
  const manualConfig = getSepayManualAccountConfig();

  if (apiToken) {
    return { ok: true, canPoll: true, mode: "api" };
  }

  if (hasSepayManualAccountConfig(manualConfig)) {
    return { ok: true, canPoll: false, mode: "manual" };
  }

  return {
    ok: false,
    canPoll: false,
    message: "Thiếu cấu hình SePay: cần `SEPAY_API_TOKEN` hoặc đủ `SEPAY_ACCOUNT_NUMBER`, `SEPAY_ACCOUNT_NAME`, `SEPAY_BANK_BIN`."
  };
};

const resolveSepayBankAccount = async () => {
  const configValidation = validateSepayConfig();
  if (!configValidation.ok) {
    return { enabled: false, message: configValidation.message };
  }

  const configuredBankAccountId = normalizeText(process.env.SEPAY_BANK_ACCOUNT_ID);
  const manualConfig = getSepayManualAccountConfig();
  const configuredAccountNo = manualConfig.accountNo;
  const configuredAccountName = manualConfig.accountName;
  const fallbackManual = () => (hasSepayManualAccountConfig(manualConfig) ? buildManualSepayBankAccount(manualConfig) : null);

  if (!configValidation.canPoll) {
    return buildManualSepayBankAccount(manualConfig);
  }

  const resolveByListQuery = async () => {
    const query = {
      bank_short_name: SEPAY_BANK_SHORT_NAME,
      active: 1,
      per_page: 100
    };

    if (configuredAccountNo || configuredAccountName) {
      query.q = configuredAccountNo || configuredAccountName;
    }

    let bankAccounts;
    try {
      bankAccounts = await callSepayApi("/bank-accounts", query);
    } catch (error) {
      const manual = fallbackManual();
      if (manual) return manual;
      throw error;
    }
    if (!bankAccounts.enabled) return bankAccounts;

    const items = Array.isArray(bankAccounts.data) ? bankAccounts.data : [];
    const matched =
      items.find((item) => configuredAccountNo && normalizeText(item.account_number) === configuredAccountNo) ||
      items.find((item) => normalizeText(item.bank_short_name || item.bank_code) === SEPAY_BANK_SHORT_NAME) ||
      items[0];

    if (!matched) {
      return {
        enabled: false,
        message: "Khong tim thay tai khoan BIDV tren SePay. Kiem tra SEPAY_BANK_ACCOUNT_ID hoac SEPAY_ACCOUNT_NUMBER."
      };
    }

    return {
      enabled: true,
      data: matched,
      raw: bankAccounts.raw || {}
    };
  };

  if (configuredBankAccountId) {
    try {
      const detail = await callSepayApi(`/bank-accounts/${encodeURIComponent(configuredBankAccountId)}`);
      return {
        enabled: true,
        data: detail.data || {},
        raw: detail.raw || {}
      };
    } catch (error) {
      const detailMessage = normalizeText(error?.data?.message || error.message).toLowerCase();
      const notFound =
        detailMessage.includes("bank account was not found") ||
        detailMessage.includes("not found") ||
        detailMessage.includes("khong tim thay");

      if (!notFound) {
        const manual = fallbackManual();
        if (manual) return manual;
        throw error;
      }

      const listResolved = await resolveByListQuery();
      if (listResolved.enabled) {
        return listResolved;
      }

      const manual = fallbackManual();
      if (manual) return manual;
      return listResolved;
    }
  }

  const listResolved = await resolveByListQuery();
  if (listResolved.enabled) {
    return listResolved;
  }

  return hasSepayManualAccountConfig(manualConfig) ? buildManualSepayBankAccount(manualConfig) : listResolved;
};

const isSepayBankTransfer = (payment) =>
  payment &&
  (payment.provider === "sepay" ||
    payment.provider === "vietqr" ||
    payment.method === "sepay" ||
    payment.method === "vietqr" ||
    payment.method === "bank");

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
  paid_amount: payment.paid_amount,
  paid_at: payment.paid_at,
  transaction_id: payment.transaction_id,
  bank_transaction_id: payment.bank_transaction_id,
  metadata: payment.metadata,
  payment_result: payment.payment_result,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt
});

const ensurePaymentAccess = (payment, actorUserId, actorRole) => {
  if (!payment) {
    return { status: 404, body: { message: "Payment not found" } };
  }

  if (isAdmin(actorRole) || payment.user_id === actorUserId) {
    return null;
  }

  return { status: 403, body: { message: "Forbidden" } };
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

const buildSepayPaymentResult = (payment, transaction, rawList) => {
  const paidAt = parseSepayDate(transaction?.transaction_date) || payment.paid_at || new Date();
  const paidAmount = toNumber(transaction?.amount_in) || payment.amount;

  return {
    provider: "sepay",
    status: "paid",
    transaction_id: normalizeText(transaction?.id),
    bank_transaction_id: normalizeText(transaction?.reference_number),
    paid_amount: paidAmount,
    paid_at: paidAt,
    description: normalizeText(transaction?.transaction_content),
    raw: {
      matched_transaction: transaction,
      transactions: rawList
    }
  };
};

const applySepayMatch = async (payment, transaction, rawList) => {
  const paymentResult = buildSepayPaymentResult(payment, transaction, rawList);
  const metadata = {
    ...(payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {}),
    integration_ready: true,
    sepay_last_synced_at: new Date().toISOString(),
    sepay_matched_at: new Date().toISOString()
  };

  const update = {
    provider: "sepay",
    method: payment.method === "cod" ? payment.method : "sepay",
    status: "paid",
    paid_amount: paymentResult.paid_amount,
    paid_at: paymentResult.paid_at,
    transaction_id: paymentResult.transaction_id,
    bank_transaction_id: paymentResult.bank_transaction_id,
    payment_result: paymentResult,
    metadata,
    vietqr_data: {
      ...(payment.vietqr_data && typeof payment.vietqr_data === "object" ? payment.vietqr_data : {}),
      latest_sepay_match: transaction,
      transactions: rawList
    }
  };

  const updated = await Payment.findByIdAndUpdate(payment._id, { $set: update }, { new: true, runValidators: true });
  return updated || payment;
};

const pickSepayTransaction = (payment, transactions) => {
  const descriptionKey = normalizeLooseText(payment.description);
  const descriptionToken = normalizeText(payment.description).replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase();
  const expectedAccountNo = normalizeText(payment.account_no || process.env.SEPAY_ACCOUNT_NUMBER);
  const expectedBankAccountId = normalizeText(
    payment.payment_link_id ||
      payment.vietqr_data?.bank_account_id ||
      process.env.SEPAY_BANK_ACCOUNT_ID
  );
  const createdAtMs = new Date(payment.createdAt).getTime();

  const scoredCandidates = (Array.isArray(transactions) ? transactions : [])
    .filter((item) => normalizeText(item.transfer_type || "in").toLowerCase() === "in")
    .filter((item) => toNumber(item.amount_in) === payment.amount)
    .map((item) => {
      const content = normalizeLooseText(item.transaction_content);
      const accountNumberMatches = !expectedAccountNo || normalizeText(item.account_number) === expectedAccountNo;
      const bankAccountIdMatches = Boolean(expectedBankAccountId) && normalizeText(item.bank_account_id) === expectedBankAccountId;
      const accountMatches = accountNumberMatches || bankAccountIdMatches;
      const contentMatchesDescription = !descriptionKey || content.includes(descriptionKey);
      const contentMatchesToken = Boolean(descriptionToken) && content.includes(descriptionToken);
      const paidAt = parseSepayDate(item.transaction_date);
      const timeMatches = !paidAt || paidAt.getTime() >= createdAtMs - 10 * 60 * 1000;

      let score = 0;
      if (accountNumberMatches) score += 3;
      if (bankAccountIdMatches) score += 4;
      if (contentMatchesDescription) score += 4;
      if (contentMatchesToken) score += 5;
      if (timeMatches) score += 1;

      return {
        item,
        score,
        accountMatches,
        accountNumberMatches,
        bankAccountIdMatches,
        contentMatchesDescription,
        contentMatchesToken,
        timeMatches,
        paidAtMs: paidAt?.getTime() || 0
      };
    })
    .filter((entry) => {
      if (entry.contentMatchesDescription || entry.contentMatchesToken) {
        return true;
      }

      return entry.accountMatches && entry.timeMatches;
    });

  if (scoredCandidates.length === 0) return null;

  return scoredCandidates
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.paidAtMs - left.paidAtMs;
    })[0]
    .item;
};

const fetchSepayTransactionsForPayment = async (payment) => {
  const lookbackDate = new Date(Date.now() - SEPAY_POLL_LOOKBACK_MINUTES * 60 * 1000);
  const transactionDateFrom = toDateTimeParam(payment.createdAt > lookbackDate ? payment.createdAt : lookbackDate);
  const bankAccountId = normalizeText(process.env.SEPAY_BANK_ACCOUNT_ID);
  const expectedAccountNo = normalizeText(payment.account_no || process.env.SEPAY_ACCOUNT_NUMBER);
  const baseQuery = {
    amount_in_min: payment.amount,
    amount_in_max: payment.amount,
    transaction_date_from: transactionDateFrom,
    per_page: 100
  };

  const queries = [
    {
      ...baseQuery,
      q: payment.description,
      ...(bankAccountId ? { bank_account_id: bankAccountId } : {})
    },
    {
      ...baseQuery,
      q: payment.description
    },
    {
      ...baseQuery
    },
    {
      q: payment.description,
      ...(bankAccountId ? { bank_account_id: bankAccountId } : {})
    },
    {
      ...(expectedAccountNo ? { q: expectedAccountNo } : {}),
      per_page: 100
    },
    {
      per_page: 100
    }
  ];

  const uniqueQueries = queries.filter(
    (query, index, list) => index === list.findIndex((item) => JSON.stringify(item) === JSON.stringify(query))
  );

  let lastError = null;
  const mergedTransactions = [];

  for (const query of uniqueQueries) {
    try {
      const result = await callSepayApi("/transactions", query);
      const items = Array.isArray(result.data) ? result.data : [];
      mergedTransactions.push(...items);
      if (pickSepayTransaction(payment, mergedTransactions)) {
        return { enabled: true, data: mergedTransactions };
      }
    } catch (error) {
      lastError = error;
      const message = normalizeText(error?.data?.message || error.message).toLowerCase();
      const canFallback =
        message.includes("bank account was not found") ||
        message.includes("not found") ||
        message.includes("khong tim thay");

      if (!canFallback) {
        throw error;
      }
    }
  }

  if (mergedTransactions.length > 0) {
    return { enabled: true, data: mergedTransactions };
  }

  if (lastError) {
    throw lastError;
  }

  return { enabled: true, data: [] };
};

const syncSepayStatus = async (payment) => {
  if (!isSepayBankTransfer(payment) || ["paid", "cancelled", "failed", "refunded"].includes(payment.status)) {
    return payment;
  }

  const configValidation = validateSepayConfig();
  if (!configValidation.ok) {
    if (payment.metadata?.integration_message === configValidation.message) {
      return payment;
    }

    const updated = await Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          provider: "sepay",
          method: payment.method === "cod" ? payment.method : "sepay",
          metadata: {
            ...(payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {}),
            integration_ready: false,
            integration_message: configValidation.message
          }
        }
      },
      { new: true }
    );

    return updated || payment;
  }

  if (!configValidation.canPoll) {
    const metadata = {
      ...(payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {}),
      integration_ready: true,
      integration_message: null,
      polling: false,
      sepay_polling_disabled: true
    };

    const updated = await Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          provider: "sepay",
          method: payment.method === "cod" ? payment.method : "sepay",
          metadata
        }
      },
      { new: true }
    );

    return updated || payment;
  }

  const transactionsRes = await fetchSepayTransactionsForPayment(payment);
  if (!transactionsRes.enabled) {
    return payment;
  }

  const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
  const matchedTransaction = pickSepayTransaction(payment, transactions);

  const baseMetadata = {
    ...(payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {}),
    integration_ready: true,
    integration_message: null,
    sepay_last_synced_at: new Date().toISOString(),
    sepay_transactions_checked: transactions.length
  };

  if (!matchedTransaction) {
    const updated = await Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          provider: "sepay",
          method: payment.method === "cod" ? payment.method : "sepay",
          metadata: baseMetadata,
          vietqr_data: {
            ...(payment.vietqr_data && typeof payment.vietqr_data === "object" ? payment.vietqr_data : {}),
            last_sepay_poll: {
              at: new Date().toISOString(),
              transactions_checked: transactions.length,
              latest_transactions: transactions.slice(0, 5)
            }
          }
        }
      },
      { new: true }
    );

    return updated || payment;
  }

  return applySepayMatch(payment, matchedTransaction, transactions);
};

const buildSepayTransferInfo = async ({ amount, description }) => {
  const bankAccount = await resolveSepayBankAccount();
  if (!bankAccount.enabled) {
    return bankAccount;
  }

  const accountName = normalizeText(bankAccount.data?.account_holder_name || process.env.SEPAY_ACCOUNT_NAME);
  const accountNo = normalizeText(bankAccount.data?.account_number || process.env.SEPAY_ACCOUNT_NUMBER);
  const acqId = normalizeText(bankAccount.data?.bank_bin || SEPAY_BANK_BIN);
  const addInfo = sanitizeDescription(description);
  const qrImageURL = buildVietQrImageUrl({
    bankId: acqId,
    accountNo,
    accountName,
    amount,
    addInfo
  });

  return {
    enabled: true,
    raw: bankAccount.raw || {},
    data: {
      bankAccountId: normalizeText(bankAccount.data?.id),
      accountName,
      accountNo,
      acqId,
      bankShortName: normalizeText(bankAccount.data?.bank_short_name || SEPAY_BANK_SHORT_NAME),
      bankFullName: normalizeText(bankAccount.data?.bank_full_name),
      addInfo,
      amount,
      qrCode: qrImageURL,
      qrDataURL: qrImageURL,
      qrImageURL
    }
  };
};

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
      baseUpdate.metadata = { ...baseUpdate.metadata, integration_ready: true, integration_message: null };
    }
  }

  if (provider === "sepay") {
    const sepay = await buildSepayTransferInfo({ amount, description });
    if (!sepay.enabled) {
      integrationMessage = sepay.message;
      baseUpdate.metadata = { ...baseUpdate.metadata, integration_ready: false, integration_message: sepay.message };
      baseUpdate.status = "pending";
    } else {
      integrationMode = "sepay:polling";
      baseUpdate.status = "pending";
      baseUpdate.qr_code = normalizeText(sepay.data?.qrCode);
      baseUpdate.qr_data_url = normalizeText(sepay.data?.qrDataURL);
      baseUpdate.qr_image_url = normalizeText(sepay.data?.qrImageURL);
      baseUpdate.account_name = normalizeText(sepay.data?.accountName);
      baseUpdate.account_no = normalizeText(sepay.data?.accountNo);
      baseUpdate.acq_id = normalizeText(sepay.data?.acqId);
      baseUpdate.payment_link_id = normalizeText(sepay.data?.bankAccountId);
      baseUpdate.vietqr_data = {
        bank_short_name: sepay.data?.bankShortName,
        bank_full_name: sepay.data?.bankFullName,
        addInfo: sepay.data?.addInfo,
        bank_account_id: sepay.data?.bankAccountId,
        polling: true
      };
      baseUpdate.metadata = { ...baseUpdate.metadata, integration_ready: true, integration_message: null, polling: true };
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
  } else if (isSepayBankTransfer(payment)) {
    payment = await syncSepayStatus(payment);
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

  const payment = await Payment.findByIdAndUpdate(id, { status: normalizedStatus }, { new: true, runValidators: true });

  if (!payment) {
    return { status: 404, body: { message: "Payment not found" } };
  }

  return { status: 200, body: serializePaymentResponse(payment) };
};

const getPaymentSepay = async (id, actorUserId, actorRole) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { status: 400, body: { message: "Invalid payment id" } };
  }

  let payment = await Payment.findById(id);
  const accessError = ensurePaymentAccess(payment, actorUserId, actorRole);
  if (accessError) return accessError;

  const description = payment.description || buildDefaultDescription(payment.order_id);
  const sepay = await buildSepayTransferInfo({ amount: payment.amount, description });
  if (!sepay.enabled) {
    return { status: 400, body: { message: sepay.message } };
  }

  const updated = await Payment.findByIdAndUpdate(
    payment._id,
    {
      method: payment.method === "cod" ? payment.method : "sepay",
      provider: "sepay",
      qr_code: normalizeText(sepay.data?.qrCode),
      qr_data_url: normalizeText(sepay.data?.qrDataURL),
      qr_image_url: normalizeText(sepay.data?.qrImageURL),
      account_name: normalizeText(sepay.data?.accountName),
      account_no: normalizeText(sepay.data?.accountNo),
      acq_id: normalizeText(sepay.data?.acqId),
      payment_link_id: normalizeText(sepay.data?.bankAccountId),
      vietqr_data: {
        ...(payment.vietqr_data && typeof payment.vietqr_data === "object" ? payment.vietqr_data : {}),
        bank_short_name: sepay.data?.bankShortName,
        bank_full_name: sepay.data?.bankFullName,
        addInfo: sepay.data?.addInfo,
        bank_account_id: sepay.data?.bankAccountId,
        polling: true
      },
      metadata: {
        ...(payment.metadata && typeof payment.metadata === "object" ? payment.metadata : {}),
        integration_ready: true,
        integration_message: null,
        polling: true
      }
    },
    { new: true, runValidators: true }
  );

  payment = updated || payment;
  payment = await syncSepayStatus(payment);

  return {
    status: 200,
    body: {
      payment: serializePaymentResponse(payment),
      transfer: {
        account_name: normalizeText(sepay.data?.accountName),
        account_no: normalizeText(sepay.data?.accountNo),
        acq_id: normalizeText(sepay.data?.acqId),
        bank_short_name: normalizeText(sepay.data?.bankShortName),
        bank_full_name: normalizeText(sepay.data?.bankFullName),
        content: normalizeText(sepay.data?.addInfo || description),
        amount: payment.amount
      }
    }
  };
};

module.exports = {
  createPayment,
  listPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentSepay
};
