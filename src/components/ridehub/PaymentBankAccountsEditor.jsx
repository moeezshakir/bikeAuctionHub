"use client";

import { MAX_PAYMENT_BANK_ACCOUNTS } from "@/lib/paymentBankAccounts";

export function PaymentBankAccountsEditor({ accounts, instructions, onAccountsChange, onInstructionsChange }) {
  function updateAccount(id, patch) {
    onAccountsChange(accounts.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  return (
    <div className="payment-banks-editor">
      <label className="full-span">
        General payment instructions (shown above all bank options)
        <textarea
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder="Transfer bid + platform fee. Use auction number as reference. Then tap I paid online."
          rows={3}
          value={instructions || ""}
        />
      </label>

      {accounts.map((account, index) => (
        <div className="payment-bank-row" key={account.id}>
          <div className="payment-bank-row-head">
            <strong>
              Bank option {index + 1} of {MAX_PAYMENT_BANK_ACCOUNTS}
            </strong>
            <label className="checkbox-row payment-bank-toggle">
              <input
                checked={account.enabled !== false}
                onChange={(e) => updateAccount(account.id, { enabled: e.target.checked })}
                type="checkbox"
              />
              <span>Show to winners</span>
            </label>
          </div>
          <div className="form-grid payment-bank-row-grid">
            <label>
              Label (shown to winner)
              <input
                onChange={(e) => updateAccount(account.id, { label: e.target.value })}
                placeholder={`Bank option ${index + 1}`}
                value={account.label || ""}
              />
            </label>
            <label>
              Bank name
              <input
                onChange={(e) => updateAccount(account.id, { bank_name: e.target.value })}
                placeholder="e.g. HBL"
                value={account.bank_name || ""}
              />
            </label>
            <label>
              Account title
              <input
                onChange={(e) => updateAccount(account.id, { account_title: e.target.value })}
                placeholder="Account holder name"
                value={account.account_title || ""}
              />
            </label>
            <label>
              Account number
              <input
                onChange={(e) => updateAccount(account.id, { account_number: e.target.value })}
                placeholder="1234567890123"
                value={account.account_number || ""}
              />
            </label>
            <label>
              IBAN
              <input
                onChange={(e) => updateAccount(account.id, { iban: e.target.value })}
                placeholder="PK00XXXX..."
                value={account.iban || ""}
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
