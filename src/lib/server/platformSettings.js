import { PlatformSettings } from "@/lib/server/models";
import { normalizeAuctionRequestFields, serializeAuctionRequestFieldsApi } from "@/lib/auctionRequestFields";
import {
  getActivePaymentBankAccounts,
  hasConfiguredPaymentBankAccounts,
  normalizePaymentBankAccounts,
  serializePaymentBankAccountsApi,
} from "@/lib/paymentBankAccounts";

const SETTINGS_KEY = "global";
const DEFAULT_SELLER_FEE_PERCENT = 5;
const DEFAULT_BUYER_FEE_PERCENT = 0.3;
const DEFAULT_BID_DEPOSIT = 500;

export const ALLOWED_CURRENCIES = ["PKR", "USD", "CAD"];

export function clampSellerFeePercent(value) {
  const num = Math.round(Number(value));
  if (!Number.isFinite(num)) return DEFAULT_SELLER_FEE_PERCENT;
  return Math.min(5, Math.max(1, num));
}

/** @deprecated Use clampSellerFeePercent */
export function clampFeePercent(value) {
  return clampSellerFeePercent(value);
}

export function clampBuyerFeePercent(value) {
  const num = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(num)) return DEFAULT_BUYER_FEE_PERCENT;
  return Math.min(1.9, Math.max(0.1, num));
}

function normalizePaymentField(value) {
  return String(value || "").trim();
}

function legacyBankFieldsFromAccounts(accounts) {
  const primary = getActivePaymentBankAccounts(accounts)[0] || null;
  return {
    paymentBankName: primary?.bank_name || "",
    paymentAccountTitle: primary?.account_title || "",
    paymentAccountNumber: primary?.account_number || "",
    paymentIban: primary?.iban || "",
  };
}

export function serializePlatformSettings(settings) {
  const paymentBankAccounts = normalizePaymentBankAccounts(settings?.paymentBankAccounts, {
    paymentBankName: settings?.paymentBankName,
    paymentAccountTitle: settings?.paymentAccountTitle,
    paymentAccountNumber: settings?.paymentAccountNumber,
    paymentIban: settings?.paymentIban,
  });
  const legacyBank = legacyBankFieldsFromAccounts(paymentBankAccounts);

  return {
    platformFeePercent: clampSellerFeePercent(settings?.platformFeePercent),
    buyerFeePercent: clampBuyerFeePercent(settings?.buyerFeePercent),
    bidDepositAmount: Number(settings?.bidDepositAmount || DEFAULT_BID_DEPOSIT),
    paymentBankName: legacyBank.paymentBankName,
    paymentAccountTitle: legacyBank.paymentAccountTitle,
    paymentAccountNumber: legacyBank.paymentAccountNumber,
    paymentIban: legacyBank.paymentIban,
    paymentInstructions: normalizePaymentField(settings?.paymentInstructions),
    paymentBankAccounts,
    auctionRequestFields: normalizeAuctionRequestFields(settings?.auctionRequestFields),
  };
}

export function serializePlatformSettingsApi(settings) {
  const normalized = serializePlatformSettings(settings);
  const activeAccounts = getActivePaymentBankAccounts(normalized.paymentBankAccounts);

  return {
    platform_fee_percent: normalized.platformFeePercent,
    seller_fee_percent: normalized.platformFeePercent,
    buyer_fee_percent: normalized.buyerFeePercent,
    bid_deposit_amount: normalized.bidDepositAmount,
    payment_bank_name: normalized.paymentBankName,
    payment_account_title: normalized.paymentAccountTitle,
    payment_account_number: normalized.paymentAccountNumber,
    payment_iban: normalized.paymentIban,
    payment_instructions: normalized.paymentInstructions,
    payment_bank_accounts: serializePaymentBankAccountsApi(normalized.paymentBankAccounts),
    payment_bank_accounts_active: activeAccounts.map((entry) => serializePaymentBankAccountsApi([entry])[0]),
    auction_request_fields: serializeAuctionRequestFieldsApi(normalized.auctionRequestFields),
    seller_fee_range: { min: 1, max: 5 },
    buyer_fee_range: { min: 0.1, max: 1.9 },
    fee_range: { min: 1, max: 5 },
    payment_note:
      "Pay the winning bid plus purchaser fee to any admin bank account shown in the Won tab. Seller fee is deducted when admin credits the seller wallet. Cash is not accepted.",
  };
}

export async function getPlatformSettings() {
  let settings = await PlatformSettings.findOne({ key: SETTINGS_KEY });
  if (!settings) {
    settings = await PlatformSettings.create({
      key: SETTINGS_KEY,
      platformFeePercent: DEFAULT_SELLER_FEE_PERCENT,
      buyerFeePercent: DEFAULT_BUYER_FEE_PERCENT,
      bidDepositAmount: DEFAULT_BID_DEPOSIT,
      paymentBankName: "HBL",
      paymentAccountTitle: "Bike Auction Platform",
      paymentAccountNumber: "1234567890123",
      paymentIban: "PK36HABB0023456789012345",
      paymentInstructions:
        "Transfer the winning bid plus purchaser fee. Use your auction number as the payment reference. After paying, tap I paid online in the Won tab.",
      paymentBankAccounts: normalizePaymentBankAccounts(null, {
        paymentBankName: "HBL",
        paymentAccountTitle: "Bike Auction Platform",
        paymentAccountNumber: "1234567890123",
        paymentIban: "PK36HABB0023456789012345",
      }),
    });
  }
  return serializePlatformSettings(settings);
}

export async function updatePlatformSettings(payload = {}) {
  const current = await PlatformSettings.findOne({ key: SETTINGS_KEY });
  const sellerFee = clampSellerFeePercent(
    payload.platformFeePercent ?? payload.sellerFeePercent ?? current?.platformFeePercent
  );
  const buyerFee = clampBuyerFeePercent(payload.buyerFeePercent ?? current?.buyerFeePercent);
  const depositRaw = payload.bidDepositAmount ?? current?.bidDepositAmount ?? DEFAULT_BID_DEPOSIT;
  const deposit = Number(depositRaw);
  if (!Number.isFinite(deposit) || deposit <= 0) {
    throw new Error("Bid deposit amount must be greater than zero.");
  }

  const paymentBankAccounts = Array.isArray(payload.paymentBankAccounts)
    ? normalizePaymentBankAccounts(payload.paymentBankAccounts, {
        paymentBankName: payload.paymentBankName,
        paymentAccountTitle: payload.paymentAccountTitle,
        paymentAccountNumber: payload.paymentAccountNumber,
        paymentIban: payload.paymentIban,
      })
    : normalizePaymentBankAccounts(current?.paymentBankAccounts, {
        paymentBankName: payload.paymentBankName ?? current?.paymentBankName,
        paymentAccountTitle: payload.paymentAccountTitle ?? current?.paymentAccountTitle,
        paymentAccountNumber: payload.paymentAccountNumber ?? current?.paymentAccountNumber,
        paymentIban: payload.paymentIban ?? current?.paymentIban,
      });

  const legacyBank = legacyBankFieldsFromAccounts(paymentBankAccounts);

  const settings = await PlatformSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    {
      platformFeePercent: sellerFee,
      buyerFeePercent: buyerFee,
      bidDepositAmount: deposit,
      paymentBankName: legacyBank.paymentBankName,
      paymentAccountTitle: legacyBank.paymentAccountTitle,
      paymentAccountNumber: legacyBank.paymentAccountNumber,
      paymentIban: legacyBank.paymentIban,
      paymentInstructions: normalizePaymentField(payload.paymentInstructions),
      paymentBankAccounts,
      ...(Array.isArray(payload.auctionRequestFields)
        ? { auctionRequestFields: normalizeAuctionRequestFields(payload.auctionRequestFields) }
        : {}),
    },
    { upsert: true, new: true }
  );

  return serializePlatformSettings(settings);
}

export function computeBidDepositCharge(depositAmount, platformOrBuyerFee) {
  const deposit = Number(depositAmount);
  const buyerFeePercent =
    typeof platformOrBuyerFee === "object" && platformOrBuyerFee !== null
      ? clampBuyerFeePercent(platformOrBuyerFee.buyerFeePercent)
      : clampBuyerFeePercent(platformOrBuyerFee);
  const fee = Math.round((deposit * buyerFeePercent) / 100);
  return { deposit, platformFee: fee, buyerFee: fee, total: deposit + fee, buyerFeePercent };
}

export function computeSettlementAmounts(winningAmount, platformOrSellerFee, buyerFeeOptional) {
  let sellerFeePercent;
  let buyerFeePercent;

  if (typeof platformOrSellerFee === "object" && platformOrSellerFee !== null) {
    sellerFeePercent = clampSellerFeePercent(
      platformOrSellerFee.sellerFeePercent ?? platformOrSellerFee.platformFeePercent
    );
    buyerFeePercent = clampBuyerFeePercent(platformOrSellerFee.buyerFeePercent);
  } else {
    sellerFeePercent = clampSellerFeePercent(platformOrSellerFee);
    buyerFeePercent = clampBuyerFeePercent(buyerFeeOptional ?? DEFAULT_BUYER_FEE_PERCENT);
  }

  const winning = Number(winningAmount || 0);
  const sellerFee = Math.round((winning * sellerFeePercent) / 100);
  const buyerFee = Math.round((winning * buyerFeePercent) / 100);

  return {
    winningAmount: winning,
    sellerFee,
    buyerFee,
    sellerFeePercent,
    buyerFeePercent,
    platformFee: buyerFee,
    settlementFee: buyerFee,
    totalPayAmount: winning + buyerFee,
    sellerCreditAmount: winning - sellerFee,
  };
}

export function buildSettlementSnapshot(winningAmount, platform) {
  const amounts = computeSettlementAmounts(winningAmount, platform);
  return {
    sellerFeePercent: amounts.sellerFeePercent,
    buyerFeePercent: amounts.buyerFeePercent,
    winningAmount: amounts.winningAmount,
    sellerFee: amounts.sellerFee,
    buyerFee: amounts.buyerFee,
    totalPayAmount: amounts.totalPayAmount,
    sellerCreditAmount: amounts.sellerCreditAmount,
    lockedAt: new Date(),
  };
}

/** Use saved fees for completed sales; live auctions still use current platform settings. */
export function resolveSettlementForAuction(statusRow, winningAmount, platform) {
  const snap = statusRow?.settlementSnapshot;
  if (snap && Number.isFinite(Number(snap.winningAmount))) {
    return {
      winningAmount: Number(snap.winningAmount),
      sellerFeePercent: Number(snap.sellerFeePercent),
      buyerFeePercent: Number(snap.buyerFeePercent),
      sellerFee: Number(snap.sellerFee),
      buyerFee: Number(snap.buyerFee),
      totalPayAmount: Number(snap.totalPayAmount),
      sellerCreditAmount: Number(snap.sellerCreditAmount),
      platformFee: Number(snap.buyerFee),
      settlementFee: Number(snap.buyerFee),
      fromSnapshot: true,
    };
  }

  const amount = Number(winningAmount);
  if (!Number.isFinite(amount) || amount <= 0 || !platform) {
    return null;
  }

  return { ...computeSettlementAmounts(amount, platform), fromSnapshot: false };
}

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

export function getWinnerPaymentBankDetails(platform) {
  const accounts = getActivePaymentBankAccounts(platform?.paymentBankAccounts);
  const primary = accounts[0];
  if (!primary) {
    return {
      bankName: normalizePaymentField(platform?.paymentBankName),
      accountTitle: normalizePaymentField(platform?.paymentAccountTitle),
      accountNumber: normalizePaymentField(platform?.paymentAccountNumber),
      iban: normalizePaymentField(platform?.paymentIban),
      instructions: normalizePaymentField(platform?.paymentInstructions),
    };
  }
  return {
    bankName: primary.bank_name,
    accountTitle: primary.account_title,
    accountNumber: primary.account_number,
    iban: primary.iban,
    instructions: normalizePaymentField(platform?.paymentInstructions),
  };
}

export function hasWinnerPaymentBankDetails(platform) {
  return (
    hasConfiguredPaymentBankAccounts(platform?.paymentBankAccounts) ||
    Boolean(platform?.paymentAccountNumber || platform?.paymentIban)
  );
}

export function formatWinnerPaymentNotice(platform, { auctionId, winningAmount, currency = "PKR" }) {
  const { winningAmount: bid, buyerFee, totalPayAmount, buyerFeePercent } = computeSettlementAmounts(
    winningAmount,
    platform
  );
  const accounts = getActivePaymentBankAccounts(platform?.paymentBankAccounts);

  if (!accounts.length && !platform?.paymentAccountNumber && !platform?.paymentIban) {
    return `You won auction #${auctionId}. Pay ${totalPayAmount} ${currency} (bid ${bid} + ${buyerFee} ${currency} purchaser fee at ${buyerFeePercent}%). Open the Won tab for payment steps once admin publishes bank accounts. Cash is not accepted.`;
  }

  const lines = (accounts.length ? accounts : [getWinnerPaymentBankDetails(platform)]).map((entry, index) => {
    const label = entry.label || `Option ${index + 1}`;
    const bankName = entry.bank_name || entry.bankName;
    const accountNumber = entry.account_number || entry.accountNumber;
    const iban = entry.iban;
    return `${label}: ${[bankName, accountNumber ? `Acct ${accountNumber}` : null, iban ? `IBAN ${iban}` : null].filter(Boolean).join(" · ")}`;
  });

  return `You won auction #${auctionId}. Transfer ${totalPayAmount} ${currency} (bid ${bid} + purchaser fee ${buyerFee} ${currency} at ${buyerFeePercent}%) to any of these admin accounts: ${lines.join(" | ")}. Reference: Auction #${auctionId}. Then open Won tab and tap I paid online. Cash is not accepted.`;
}
