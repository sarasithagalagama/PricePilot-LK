// Title normalization and tokenization
export function normalizeTitle(rawTitle) {
  return rawTitle
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ") // Remove special chars
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

// Extract brand from title (common laptop/component brands)
export function extractBrand(rawTitle) {
  const brands = [
    "msi",
    "asus",
    "dell",
    "hp",
    "lenovo",
    "acer",
    "samsung",
    "intel",
    "amd",
    "corsair",
    "kingston",
    "crucial",
    "seagate",
    "western digital",
    "nvidia",
    "gigabyte",
    "evga",
    "rtx",
    "gtx",
  ];

  const normalized = rawTitle.toLowerCase();
  for (const brand of brands) {
    if (normalized.includes(brand)) {
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }
  return "Unknown";
}

// Extract category from title
export function extractCategory(rawTitle) {
  const normalized = rawTitle.toLowerCase();

  if (
    normalized.includes("laptop") ||
    normalized.includes("notebook") ||
    normalized.includes("macbook") ||
    normalized.includes("ultrabook")
  ) {
    return "laptops";
  }

  if (
    normalized.includes("gpu") ||
    normalized.includes("rtx") ||
    normalized.includes("gtx")
  ) {
    return "graphics-cards";
  }

  if (normalized.includes("cpu") || normalized.includes("processor")) {
    return "processors";
  }

  if (
    normalized.includes("ram") ||
    normalized.includes("memory") ||
    normalized.includes("ddr")
  ) {
    return "memory";
  }

  if (
    normalized.includes("ssd") ||
    normalized.includes("nvme") ||
    normalized.includes("m.2") ||
    normalized.includes("solid state drive")
  ) {
    return "storage";
  }

  if (normalized.includes("hdd") || normalized.includes("hard drive")) {
    return "storage";
  }

  return "components";
}

// Extract model number (heuristic)
export function extractModel(rawTitle, brand) {
  const regex =
    /(?:model\s+|m\.?|model\s*#|#)?([a-z0-9]+(?:[a-z0-9\-\.]*[a-z0-9]+)?)/i;
  const match = rawTitle.match(regex);
  return match ? match[1].toUpperCase() : null;
}

// Parse price from various formats
export function parsePrice(priceStr) {
  if (!priceStr) return null;

  const num = parseFloat(priceStr.replace(/[^0-9.,]/g, "").replace(",", ""));

  return isNaN(num) ? null : Math.round(num);
}

// Parse stock status
export function parseStockStatus(stockStr) {
  if (!stockStr) return "in_stock";

  const normalized = stockStr.toLowerCase();
  if (
    normalized.includes("out of stock") ||
    normalized.includes("unavailable")
  ) {
    return "out_of_stock";
  }
  if (normalized.includes("limited") || normalized.includes("few")) {
    return "limited";
  }
  return "in_stock";
}

// Compute similarity score for title matching (0-1)
export function computeTitleSimilarity(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  if (norm1 === norm2) return 1.0;

  // Levenshtein distance (simplified)
  const len1 = norm1.length;
  const len2 = norm2.length;
  const d = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) d[0][i] = i;
  for (let j = 0; j <= len2; j++) d[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
      d[j][i] = Math.min(
        d[j][i - 1] + 1,
        d[j - 1][i] + 1,
        d[j - 1][i - 1] + cost,
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - d[len2][len1] / maxLen;
}
