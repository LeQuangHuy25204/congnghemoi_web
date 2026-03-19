const normalizeText = (value) => {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractPriceVnd = (message) => {
  const text = normalizeText(message);
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(trieu|tr|cu|k|nghin|ngan)?/);
  if (!match) return null;

  const raw = match[1].replace(",", ".");
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return null;

  const unit = match[2] || "";
  if (unit === "k" || unit === "nghin" || unit === "ngan") {
    return Math.round(value * 1000);
  }
  if (unit === "tr" || unit === "trieu" || unit === "cu") {
    return Math.round(value * 1_000_000);
  }

  return Math.round(value);
};

module.exports = {
  normalizeText,
  extractPriceVnd
};
