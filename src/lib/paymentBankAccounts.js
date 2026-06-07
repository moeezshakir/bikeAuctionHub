export const MAX_PAYMENT_BANK_ACCOUNTS = 3;

export function createEmptyPaymentBankAccounts() {
  return Array.from({ length: MAX_PAYMENT_BANK_ACCOUNTS }, (_, index) => ({
    id: `account_${index + 1}`,
    label: `Bank option ${index + 1}`,
    bank_name: "",
    account_title: "",
    account_number: "",
    iban: "",
    enabled: false,
  }));
}

function normalizeOne(entry = {}, fallback) {
  return {
    id: fallback.id,
    label: String(entry.label ?? fallback.label).trim() || fallback.label,
    bank_name: String(entry.bank_name ?? entry.bankName ?? "").trim(),
    account_title: String(entry.account_title ?? entry.accountTitle ?? "").trim(),
    account_number: String(entry.account_number ?? entry.accountNumber ?? "").trim(),
    iban: String(entry.iban ?? "").trim(),
    enabled: entry.enabled === false ? false : Boolean(entry.enabled ?? fallback.enabled),
  };
}

export function normalizePaymentBankAccounts(raw, legacy = {}) {
  const slots = createEmptyPaymentBankAccounts();
  const byId = new Map(Array.isArray(raw) ? raw.map((entry) => [entry.id, entry]) : []);

  const normalized = slots.map((fallback) => normalizeOne(byId.get(fallback.id) || {}, fallback));

  const hasAny = normalized.some((entry) => entry.enabled && (entry.account_number || entry.iban));
  if (!hasAny && (legacy.paymentBankName || legacy.paymentAccountNumber || legacy.paymentIban)) {
    normalized[0] = {
      ...normalized[0],
      enabled: true,
      label: normalized[0].label || "Primary bank account",
      bank_name: String(legacy.paymentBankName || "").trim(),
      account_title: String(legacy.paymentAccountTitle || "").trim(),
      account_number: String(legacy.paymentAccountNumber || "").trim(),
      iban: String(legacy.paymentIban || "").trim(),
    };
  }

  return normalized;
}

export function getActivePaymentBankAccounts(accounts) {
  return normalizePaymentBankAccounts(accounts).filter(
    (entry) => entry.enabled !== false && (entry.account_number || entry.iban)
  );
}

export function hasConfiguredPaymentBankAccounts(accounts) {
  return getActivePaymentBankAccounts(accounts).length > 0;
}

export function serializePaymentBankAccountsApi(accounts) {
  return normalizePaymentBankAccounts(accounts).map((entry) => ({
    id: entry.id,
    label: entry.label,
    bank_name: entry.bank_name,
    account_title: entry.account_title,
    account_number: entry.account_number,
    iban: entry.iban,
    enabled: entry.enabled,
  }));
}

export function formatPaymentBankAccountLine(account) {
  if (!account) return "";
  return [
    account.label,
    account.bank_name,
    account.account_number ? `Acct ${account.account_number}` : null,
    account.iban ? `IBAN ${account.iban}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function buildPaymentBankAccountsFormState(raw, legacy = {}) {
  return normalizePaymentBankAccounts(raw, legacy);
}
