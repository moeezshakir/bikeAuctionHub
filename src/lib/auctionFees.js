export function clampBuyerFeePercent(value) {
  const num = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(num)) return 0.3;
  return Math.min(1.9, Math.max(0.1, num));
}

export function clampSellerFeePercent(value) {
  const num = Math.round(Number(value));
  if (!Number.isFinite(num)) return 5;
  return Math.min(5, Math.max(1, num));
}

/** Purchaser / winner pays bid + this fee */
export function computePriceFeePreview(amount, buyerFeePercent) {
  const base = Number(amount || 0);
  if (!Number.isFinite(base) || base <= 0) {
    return { base: 0, platformFee: 0, buyerFee: 0, totalPayAmount: 0, feePercent: clampBuyerFeePercent(buyerFeePercent) };
  }
  const pct = clampBuyerFeePercent(buyerFeePercent);
  const buyerFee = Math.round((base * pct) / 100);
  return {
    base,
    platformFee: buyerFee,
    buyerFee,
    totalPayAmount: base + buyerFee,
    feePercent: pct,
  };
}

/** Seller receives bid minus this fee when admin credits wallet */
export function computeSellerCreditPreview(amount, sellerFeePercent) {
  const base = Number(amount || 0);
  if (!Number.isFinite(base) || base <= 0) {
    return { base: 0, sellerFee: 0, sellerCreditAmount: 0, feePercent: clampSellerFeePercent(sellerFeePercent) };
  }
  const pct = clampSellerFeePercent(sellerFeePercent);
  const sellerFee = Math.round((base * pct) / 100);
  return {
    base,
    sellerFee,
    sellerCreditAmount: base - sellerFee,
    feePercent: pct,
  };
}
