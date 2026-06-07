"use client";

import Link from "next/link";
import { HiCurrencyDollar, HiWallet } from "react-icons/hi2";

export function WalletRechargeDialog({ open, onClose, balance, required, currencyLabel = "PKR", onGoWallet, reason }) {
  if (!open) return null;

  const shortfall = Math.max(0, Number(required?.total || 0) - Number(balance || 0));
  const bidAmount = Number(required?.bidAmount || 0);

  const headline =
    reason === "bid" || reason === "bid_and_deposit"
      ? "Your wallet balance is too low for this bid"
      : "Please recharge your wallet to take part";

  const detail =
    reason === "bid_and_deposit"
      ? `Your bid amount plus the first-bid deposit and platform fee must be available in your wallet. Cash is not accepted.`
      : reason === "bid" || reason === "minimum_bid"
        ? `Your wallet balance must cover the bid amount you want to place. Cash is not accepted.`
        : `Your wallet must cover the minimum bid in this auction plus the first-bid deposit and platform fee. Cash is not accepted.`;

  return (
    <div className="dialog-overlay wallet-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="wallet-dialog-title">
      <div className="dialog-card wallet-dialog-card">
        <div className="wallet-dialog-icon">
          <HiWallet />
        </div>
        <p className="section-kicker">Insufficient balance</p>
        <h3 id="wallet-dialog-title">{headline}</h3>
        <p className="muted-copy">{detail}</p>
        <div className="wallet-dialog-stats">
          <div className="wallet-stat">
            <span>Your balance</span>
            <strong>
              {currencyLabel} {Number(balance || 0).toLocaleString()}
            </strong>
          </div>
          <div className="wallet-stat">
            <span>Required in wallet</span>
            <strong>
              {currencyLabel} {Number(required?.total || 0).toLocaleString()}
            </strong>
          </div>
          <div className="wallet-stat wallet-stat-warn">
            <span>Short by</span>
            <strong>
              {currencyLabel} {shortfall.toLocaleString()}
            </strong>
          </div>
        </div>
        {bidAmount > 0 ? (
          <p className="wallet-fee-breakdown">
            <HiCurrencyDollar aria-hidden="true" />
            Includes bid {currencyLabel} {bidAmount.toLocaleString()}
            {reason === "bid_and_deposit" || reason === "minimum_bid_and_deposit" ? (
              <>
                {" "}
                + deposit {currencyLabel} {Number(required?.deposit || 0).toLocaleString()} + fee {required?.feePct}% (
                {currencyLabel} {Number(required?.fee || 0).toLocaleString()})
              </>
            ) : null}
          </p>
        ) : required ? (
          <p className="wallet-fee-breakdown">
            <HiCurrencyDollar aria-hidden="true" />
            Includes deposit {currencyLabel} {Number(required.deposit || 0).toLocaleString()} + platform fee {required.feePct}% (
            {currencyLabel} {Number(required.fee || 0).toLocaleString()})
          </p>
        ) : null}
        <div className="quick-actions wallet-dialog-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          {onGoWallet ? (
            <button className="primary-button" onClick={onGoWallet} type="button">
              Recharge wallet
            </button>
          ) : (
            <Link className="primary-button" href="/wallet" onClick={onClose}>
              Recharge wallet
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function computeBidDepositRequired(platformSettings = {}) {
  const deposit = Number(platformSettings.bid_deposit_amount || 500);
  const feePct = Number(platformSettings.buyer_fee_percent ?? platformSettings.platform_fee_percent ?? 0.3);
  const fee = Math.round((deposit * feePct) / 100);
  return { deposit, fee, feePct, total: deposit + fee };
}

export function userAlreadyBidOnAuction(slot, userId) {
  return (slot?.participants || []).some((entry) => Number(entry.user_id) === Number(userId));
}

export function checkWalletForBid({ wallet, platformSettings, slot, userId, bidAmount }) {
  const balance = Number(wallet?.remainingBalance || 0);
  const alreadyBid = userAlreadyBidOnAuction(slot, userId);
  const deposit = computeBidDepositRequired(platformSettings);
  const lowest = Number(slot?.lowest_prize || 0);
  const amount = Number(bidAmount || 0);

  if (Number.isFinite(amount) && amount > 0) {
    const need = alreadyBid ? amount : amount + deposit.total;
    if (balance < need) {
      return {
        ok: false,
        reason: alreadyBid ? "bid" : "bid_and_deposit",
        required: { ...deposit, total: need, bidAmount: amount },
        balance,
        shortfall: need - balance,
      };
    }
    return { ok: true, required: deposit, balance };
  }

  const minNeed = alreadyBid ? lowest : lowest + deposit.total;
  if (lowest > 0 && balance < minNeed) {
    return {
      ok: false,
      reason: alreadyBid ? "minimum_bid" : "minimum_bid_and_deposit",
      required: { ...deposit, total: minNeed, bidAmount: lowest },
      balance,
      shortfall: minNeed - balance,
    };
  }

  if (!alreadyBid && balance < deposit.total) {
    return {
      ok: false,
      reason: "deposit",
      required: { ...deposit, bidAmount: 0 },
      balance,
      shortfall: deposit.total - balance,
    };
  }

  return { ok: true, required: deposit, balance };
}
