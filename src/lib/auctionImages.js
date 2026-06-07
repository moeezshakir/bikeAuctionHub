export const AUCTION_PLACEHOLDER_IMAGES = [
  "/images/auction/slot-1.svg",
  "/images/auction/slot-2.svg",
  "/images/auction/slot-3.svg",
  "/images/auction/slot-4.svg",
];

export const AUCTION_PLACEHOLDER_IMAGE = AUCTION_PLACEHOLDER_IMAGES[0];

export function toPublicAssetUrl(src) {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("blob:") || src.startsWith("data:")) return src;
  return src.startsWith("/") ? src : `/${src}`;
}

/** Legacy seed paths and missing uploads map to bundled demo placeholders. */
export function resolveAuctionImagePath(src, index = 0) {
  const normalized = String(src || "").trim();
  if (!normalized) {
    return AUCTION_PLACEHOLDER_IMAGES[index % AUCTION_PLACEHOLDER_IMAGES.length];
  }

  const lower = normalized.toLowerCase();
  if (
    lower.includes("auctionslots_bikes_image") ||
    lower.includes("placeholder") ||
    lower.endsWith(".php")
  ) {
    return AUCTION_PLACEHOLDER_IMAGES[index % AUCTION_PLACEHOLDER_IMAGES.length];
  }

  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }

  return toPublicAssetUrl(normalized);
}

export function resolveAuctionImageSet(slot) {
  const raw = [slot?.image_1, slot?.image_2, slot?.image_3, slot?.image_4];
  const resolved = raw.map((entry, index) => resolveAuctionImagePath(entry, index)).filter(Boolean);
  return resolved.length ? resolved : [AUCTION_PLACEHOLDER_IMAGE];
}
