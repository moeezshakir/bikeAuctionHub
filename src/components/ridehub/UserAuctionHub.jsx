"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HiBolt,
  HiCheckCircle,
  HiClock,
  HiCurrencyDollar,
  HiDocumentCheck,
  HiHandRaised,
  HiMapPin,
  HiPhoto,
  HiShieldCheck,
  HiStopCircle,
  HiTag,
  HiTrophy,
  HiUserGroup,
  HiWallet,
} from "react-icons/hi2";
import {
  auctionAction,
  createAuctionSlot,
  getAuctionCategories,
  getAuctionSlotsByFilter,
  getPlatformSettings,
  getStores,
  getWalletBalance,
  placeAuctionBid,
} from "@/lib/legacyApi";
import { useUserApp } from "@/components/ridehub/userAppContext";
import { AuctionGallery } from "@/components/ridehub/AuctionGallery";
import { AuctionRequestFormFields } from "@/components/ridehub/AuctionRequestFormFields";
import {
  WalletRechargeDialog,
  checkWalletForBid,
  computeBidDepositRequired,
} from "@/components/ridehub/WalletRechargeDialog";
import { ConfirmDialog, PromptDialog } from "@/components/ridehub/AppDialog";
import { computePriceFeePreview, computeSellerCreditPreview } from "@/lib/auctionFees";
import { buildCreateFormValidation, normalizeAuctionRequestFields } from "@/lib/auctionRequestFields";
import { getUploadValidationError } from "@/lib/uploadImages";
import { formatPaymentBankAccountLine, getActivePaymentBankAccounts } from "@/lib/paymentBankAccounts";

const AUCTION_POLICY = [
  "You must own the item and it must be registered on your CNIC when applicable.",
  "Uploaded images must be recent and show the actual condition.",
  "Admin may reject requests that look misleading or incomplete.",
  "After approval you have 6 hours to start the auction or the slot expires.",
  "Once live, an auction runs for a maximum of 3 hours then closes automatically.",
  "You can start up to 3 auctions per calendar day.",
  "Bidders must pay a web wallet deposit before their first bid (cash not accepted).",
  "A platform fee (1–8%, set by admin) applies on deposits and settlement.",
  "Pickup at the assigned store happens only after online payment is confirmed.",
];

function formatCountdown(ms) {
  if (!ms || ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatMoney(value, currency = "PKR") {
  const code = currency === "PKR" ? "PKR" : currency;
  try {
    return new Intl.NumberFormat(code === "PKR" ? "en-PK" : "en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString()}`;
  }
}

function statusLabel(status) {
  const map = {
    pending_review: "In queue (up to 48h)",
    approved: "Approved — start within 6h",
    rejected: "Rejected",
    expired: "Start window expired",
    live: "Live",
    completed: "Completed",
    stopped: "Stopped",
  };
  return map[status] || status;
}

function statusPillClass(status) {
  const map = {
    pending_review: "warning",
    approved: "info",
    rejected: "danger",
    expired: "danger",
    live: "live",
    completed: "success",
    stopped: "neutral",
  };
  return map[status] || "warning";
}

function bidFeedLine(bid, currency) {
  return `${bid.name}: set bid on ${formatMoney(bid.prize, currency)}`;
}

function EmptyState({ title, copy }) {
  return (
    <div className="empty-state">
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function CreateFormChecklist({ validation, showAll }) {
  const pending = validation.issues.filter((entry) => !entry.ok);
  const complete = validation.issues.filter((entry) => entry.ok);

  if (validation.ok) {
    return (
      <div className="create-form-checklist create-form-checklist-ready">
        <p className="section-kicker">Ready to submit</p>
        <p>All required steps are complete. You can submit your auction request now.</p>
      </div>
    );
  }

  return (
    <div className="create-form-checklist create-form-checklist-pending">
      <p className="section-kicker">Complete these steps to submit</p>
      <p className="muted-copy">Tap submit to see what is still missing. Required items are listed below.</p>
      <ul className="create-form-checklist-list">
        {pending.map((entry) => (
          <li className="create-form-check-item missing" key={entry.id}>
            <strong>{entry.label}</strong>
            <span>{entry.hint}</span>
          </li>
        ))}
      </ul>
      {showAll && complete.length ? (
        <>
          <p className="section-kicker completed-steps-kicker">Completed</p>
          <ul className="create-form-checklist-list completed">
            {complete.map((entry) => (
              <li className="create-form-check-item done" key={entry.id}>
                <strong>{entry.label}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function AuctionStatusBadge({ status }) {
  return <span className={`status-pill ${statusPillClass(status)}`}>{statusLabel(status)}</span>;
}

function LiveCountdownBadge({ endDeadlineAt, remainingMs, now }) {
  const endMs = endDeadlineAt ? new Date(endDeadlineAt).getTime() : 0;
  const remaining = endMs ? Math.max(0, endMs - now) : Number(remainingMs || 0);
  if (!remaining || remaining <= 0) return null;
  return (
    <span className="countdown-badge live-countdown-badge">
      <HiClock /> Closes in {formatCountdown(remaining)}
    </span>
  );
}

function BuyerFeePreviewPanel({ amount, feePercent, currency, formatMoney, label }) {
  const preview = computePriceFeePreview(amount, feePercent);
  if (!preview.base) return null;

  return (
    <div className="fee-preview-panel">
      <p className="section-kicker">{label}</p>
      <div className="fee-preview-grid">
        <span>Winning bid: {formatMoney(preview.base, currency)}</span>
        <span>
          Purchaser fee ({preview.feePercent}%): {formatMoney(preview.buyerFee, currency)}
        </span>
        <strong>Total you pay: {formatMoney(preview.totalPayAmount, currency)}</strong>
      </div>
    </div>
  );
}

function SellerFeePreviewPanel({ amount, feePercent, currency, formatMoney, label }) {
  const preview = computeSellerCreditPreview(amount, feePercent);
  if (!preview.base) return null;

  return (
    <div className="fee-preview-panel">
      <p className="section-kicker">{label}</p>
      <div className="fee-preview-grid">
        <span>Winning bid: {formatMoney(preview.base, currency)}</span>
        <span>
          Seller fee ({preview.feePercent}%): {formatMoney(preview.sellerFee, currency)}
        </span>
        <strong>You receive: {formatMoney(preview.sellerCreditAmount, currency)}</strong>
      </div>
      <p className="muted-copy fee-preview-note">
        Platform deducts the seller fee when admin credits your wallet.
      </p>
    </div>
  );
}

/** @deprecated use BuyerFeePreviewPanel or SellerFeePreviewPanel */
function FeePreviewPanel(props) {
  return <SellerFeePreviewPanel {...props} />;
}

function LockedFeesNote({ slot }) {
  if (slot.auction_status !== "completed" || !slot.fees_locked_at_sale) {
    return null;
  }

  return (
    <p className="muted-copy won-status-note fees-locked-note">
      Fees were saved when this auction completed (seller {slot.seller_fee_percent}%, purchaser {slot.buyer_fee_percent}%).
      Admin fee changes do not apply to this sale.
    </p>
  );
}

function resolveWinnerBankAccounts(slot, platformSettings = {}) {
  const fromSlot = Array.isArray(slot.payment_bank_accounts) ? slot.payment_bank_accounts : [];
  const fromSettings = Array.isArray(platformSettings.payment_bank_accounts) ? platformSettings.payment_bank_accounts : [];
  const active = getActivePaymentBankAccounts(fromSlot.length ? fromSlot : fromSettings);

  if (active.length) {
    return active;
  }

  const legacy = {
    id: "legacy_primary",
    label: "Admin bank account",
    bank_name: slot.payment_bank_name || platformSettings.payment_bank_name || "",
    account_title: slot.payment_account_title || platformSettings.payment_account_title || "",
    account_number: slot.payment_account_number || platformSettings.payment_account_number || "",
    iban: slot.payment_iban || platformSettings.payment_iban || "",
    enabled: true,
  };

  return legacy.account_number || legacy.iban ? [legacy] : [];
}

function WonBankAccountPanel({ slot, platformSettings, formatMoney, onCopy, selectedAccountId, onSelectAccount }) {
  const accounts = resolveWinnerBankAccounts(slot, platformSettings);
  const instructions = slot.payment_instructions || platformSettings.payment_instructions || "";
  const winningAmount = Number(slot.winning_bid_amount || slot.winning_bid?.prize || 0);
  const buyerFee = Number(slot.buyer_fee ?? slot.settlement_fee ?? 0);
  const totalPay = Number(slot.total_pay_amount ?? winningAmount + buyerFee);

  if (!accounts.length) {
    return (
      <div className="won-bank-callout won-bank-callout-missing">
        <p className="section-kicker">
          <HiWallet /> Payment bank accounts
        </p>
        <p className="won-payment-message">
          Admin has not published any bank account yet. Do not pay until account options appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="won-bank-callout">
      <p className="section-kicker">
        <HiWallet /> Pay to any admin bank account below
      </p>
      {instructions ? <p className="won-payment-message">{instructions}</p> : null}
      <p className="muted-copy won-bank-footnote">
        Choose one option, transfer <strong>{formatMoney(totalPay, slot.currency)}</strong> (bid + fee), reference <strong>Auction #{slot.id}</strong>, then tap I paid online.
      </p>
      <div className="won-bank-options">
        {accounts.map((account) => {
          const selected = selectedAccountId === account.id;
          return (
            <label className={`won-bank-option${selected ? " won-bank-option-selected" : ""}`} key={account.id}>
              <input
                checked={selected}
                name={`payment-bank-${slot.id}`}
                onChange={() => onSelectAccount(account.id)}
                type="radio"
              />
              <div className="won-bank-option-body">
                <strong>{account.label || account.bank_name || "Bank account"}</strong>
                <div className="won-bank-account-row">
                  <span>Bank</span>
                  <strong>{account.bank_name || "—"}</strong>
                </div>
                <div className="won-bank-account-row">
                  <span>Account title</span>
                  <strong>{account.account_title || "—"}</strong>
                </div>
                <div className="won-bank-account-row won-bank-account-highlight">
                  <span>Account number</span>
                  <strong>{account.account_number || "—"}</strong>
                  {account.account_number ? (
                    <button
                      className="ghost-button won-copy-btn"
                      onClick={(event) => {
                        event.preventDefault();
                        onCopy(account.account_number, "Account number copied");
                      }}
                      type="button"
                    >
                      Copy
                    </button>
                  ) : null}
                </div>
                {account.iban ? (
                  <div className="won-bank-account-row">
                    <span>IBAN</span>
                    <strong>{account.iban}</strong>
                    <button
                      className="ghost-button won-copy-btn"
                      onClick={(event) => {
                        event.preventDefault();
                        onCopy(account.iban, "IBAN copied");
                      }}
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function WonAuctionCard({ slot, platformSettings, onSettlement, onMarkItemGot, formatMoney, markingGot, onCopy }) {
  const title = slot.item_title || `${slot.bike_make} ${slot.bike_model}`.trim();
  const winningAmount = Number(slot.winning_bid_amount || slot.winning_bid?.prize || 0);
  const buyerFee = Number(slot.buyer_fee ?? slot.settlement_fee ?? 0);
  const totalPay = Number(slot.total_pay_amount ?? winningAmount + buyerFee);
  const sellerCredit = Number(slot.seller_credit_amount ?? winningAmount);
  const pickupName = slot.handover_store_name || slot.store_name || "Auction store";
  const pickupAddress = slot.handover_store_address || slot.store_address || slot.city || "";
  const accounts = useMemo(() => resolveWinnerBankAccounts(slot, platformSettings), [slot, platformSettings]);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const hasBankDetails = accounts.length > 0;
  const alreadyPaid = Boolean(slot.payment_forms?.userPaid?.confirmed);
  const selectedAccount = accounts.find((entry) => entry.id === selectedAccountId) || accounts[0] || null;

  useEffect(() => {
    if (!accounts.length) {
      setSelectedAccountId("");
      return;
    }
    if (!accounts.some((entry) => entry.id === selectedAccountId)) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  function handlePaidClick() {
    if (!selectedAccount) return;
    onSettlement(slot, "user_paid", selectedAccount);
  }

  return (
    <article className="owned-slot-card won-slot-card" id={`won-auction-${slot.id}`}>
      <header className="won-slot-banner">
        <span className="won-slot-icon">
          <HiTrophy />
        </span>
        <div>
          <p className="section-kicker">You won this auction</p>
          <h4>
            #{slot.id} · {title}
          </h4>
          <p className="muted-copy">
            Seller: {slot.username} · Completed {slot.completed_at ? new Date(slot.completed_at).toLocaleString() : "recently"}
          </p>
        </div>
        <AuctionStatusBadge status={slot.auction_status} />
      </header>

      <WonBankAccountPanel
        formatMoney={formatMoney}
        onCopy={onCopy}
        onSelectAccount={setSelectedAccountId}
        platformSettings={platformSettings}
        selectedAccountId={selectedAccountId}
        slot={slot}
      />

      <div className="owned-slot-gallery-row">
        <AuctionGallery label={`Won auction #${slot.id}`} size="large" slot={slot} />
      </div>

      <div className="won-info-grid">
        <div className="won-info-item">
          <strong>Your winning bid</strong>
          <span>{formatMoney(slot.winning_bid_amount || slot.winning_bid?.prize, slot.currency)}</span>
        </div>
        <div className="won-info-item">
          <strong>Purchaser fee ({slot.buyer_fee_percent ?? slot.platform_fee_percent}%)</strong>
          <span>{formatMoney(buyerFee, slot.currency)}</span>
        </div>
        <div className="won-info-item">
          <strong>Total you pay (bid + fee)</strong>
          <span>{formatMoney(totalPay, slot.currency)}</span>
        </div>
        <div className="won-info-item">
          <strong>Handover store</strong>
          <span>{slot.handover_store_id ? pickupName : "Seller will set handover store"}</span>
        </div>
        <div className="won-info-item">
          <strong>Store address</strong>
          <span>{pickupAddress || "Waiting for seller handover store"}</span>
        </div>
        <div className="won-info-item">
          <strong>Seller receives (after seller fee)</strong>
          <span>{formatMoney(sellerCredit, slot.currency)}</span>
        </div>
      </div>

      <LockedFeesNote slot={slot} />

      {slot.handover_store_id ? (
        <div className="won-steps-panel pickup-ready-panel">
          <p className="section-kicker">
            <HiMapPin /> Pickup location
          </p>
          <p className="won-payment-message">
            Come to <strong>{pickupName}</strong>
            {pickupAddress ? ` — ${pickupAddress}` : ""} to collect <strong>{title}</strong>. The seller will hand over your item there.
          </p>
          {slot.item_received ? (
            <p className="muted-copy won-status-note">You marked this item as <strong>Got</strong>.</p>
          ) : (
            <button className="primary-button" disabled={markingGot} onClick={() => onMarkItemGot(slot)} type="button">
              {markingGot ? "Saving..." : "I got my item (Got)"}
            </button>
          )}
        </div>
      ) : slot.payment_forms?.userPaid?.confirmed ? (
        <p className="muted-copy won-status-note">Waiting for the seller to choose a handover store. You will be notified when pickup is ready.</p>
      ) : null}

      <div className="won-steps-panel">
        <p className="section-kicker">
          <HiShieldCheck /> Next steps
        </p>
        <ol className="won-steps-list">
          <li>
            Transfer {formatMoney(totalPay, slot.currency)} to the admin bank account shown above (reference: Auction #{slot.id}).
          </li>
          <li>Tap <strong>I paid online</strong> below after the transfer.</li>
          <li>When the seller sets a handover store, go there to collect the item and tap <strong>Got</strong>.</li>
        </ol>
      </div>

      <div className="owned-slot-footer settlement-footer">
        <p className="section-kicker">
          <HiWallet /> Payment confirmation
        </p>
        <div className="settlement-actions">
          <button
            className="settlement-btn"
            disabled={!hasBankDetails || alreadyPaid || !selectedAccountId}
            onClick={handlePaidClick}
            type="button"
          >
            <HiWallet />
            <span>{alreadyPaid ? "Payment sent ✓" : "I paid online (web)"}</span>
          </button>
        </div>
        {!hasBankDetails && !alreadyPaid ? (
          <p className="create-form-submit-hint">Waiting for admin bank accounts — you cannot confirm payment until options appear above.</p>
        ) : null}
        {hasBankDetails && !alreadyPaid && !selectedAccountId ? (
          <p className="create-form-submit-hint">Select which bank account you paid to before confirming.</p>
        ) : null}
        {alreadyPaid ? (
          <p className="muted-copy won-status-note">
            Payment recorded ({formatMoney(totalPay, slot.currency)}).{" "}
            {slot.handover_store_id
              ? `Collect at ${pickupName}.`
              : "Waiting for seller to set handover store."}
          </p>
        ) : (
          <p className="muted-copy won-status-note">
            Transfer {formatMoney(totalPay, slot.currency)} (bid + fee), then tap the button. Only you and the seller see this fee breakdown.
          </p>
        )}
      </div>
    </article>
  );
}

function SellerHandoverPanel({ slot, stores, formatMoney, onSetHandover, submitting }) {
  const [handoverStoreId, setHandoverStoreId] = useState(
    slot.handover_store_id ? String(slot.handover_store_id) : String(slot.store_id || "")
  );
  const title = slot.item_title || `${slot.bike_make} ${slot.bike_model}`.trim();
  const winningAmount = Number(slot.winning_bid_amount || 0);
  const sellerCredit = Number(slot.seller_credit_amount ?? winningAmount);
  const sellerFeePercent = slot.seller_fee_percent ?? 5;

  if (slot.handover_store_id) {
    return (
      <div className="won-payment-panel seller-sold-panel">
        <p className="section-kicker">
          <HiMapPin /> Handover store set
        </p>
        <p className="won-payment-message seller-alert">
          Winner notified to collect <strong>{title}</strong> at <strong>{slot.handover_store_name}</strong>
          {slot.handover_store_address ? ` (${slot.handover_store_address})` : ""}. Bring the item there for the buyer.
        </p>
        {slot.item_received ? (
          <p className="muted-copy won-status-note">Buyer marked status as <strong>Got</strong>.</p>
        ) : (
          <p className="muted-copy won-status-note">Waiting for the buyer to confirm they received the item.</p>
        )}
      </div>
    );
  }

  return (
    <div className="won-payment-panel seller-sold-panel">
      <p className="section-kicker">
        <HiMapPin /> Choose handover store
      </p>
      <p className="muted-copy won-status-note">
        Select the store where you will meet the winner and hand over <strong>{title}</strong>. The winner will be notified to come and collect it.
      </p>
      <form
        className="handover-store-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!handoverStoreId) return;
          onSetHandover(slot, handoverStoreId);
        }}
      >
        <label>
          Handover store
          <select required value={handoverStoreId} onChange={(e) => setHandoverStoreId(e.target.value)}>
            <option value="">Select store…</option>
            {stores.map((store) => (
              <option key={store._id} value={store._id}>
                {store.storeName} — {store.location?.city}
                {store.location?.address ? ` (${store.location.address})` : ""}
              </option>
            ))}
          </select>
        </label>
        <SellerFeePreviewPanel
          amount={winningAmount}
          currency={slot.currency}
          feePercent={sellerFeePercent}
          formatMoney={formatMoney}
          label="Your sale — seller fee deducted at wallet credit"
        />
        <button className="primary-button" disabled={submitting || !handoverStoreId} type="submit">
          {submitting ? "Saving..." : "Set store & notify winner"}
        </button>
      </form>
      <p className="muted-copy won-status-note">
        Winning bid {formatMoney(winningAmount, slot.currency)}. You receive {formatMoney(sellerCredit, slot.currency)} after the{" "}
        {sellerFeePercent}% seller fee when admin credits your wallet.
      </p>
    </div>
  );
}

function SellerSoldPanel({ slot, formatMoney }) {
  const title = slot.item_title || `${slot.bike_make} ${slot.bike_model}`.trim();
  const winningAmount = Number(slot.winning_bid_amount || 0);
  const sellerCredit = Number(slot.seller_credit_amount ?? winningAmount);
  const sellerFeePercent = slot.seller_fee_percent ?? 5;
  const buyerPaid = Boolean(slot.payment_forms?.userPaid?.confirmed);

  return (
    <div className="won-payment-panel seller-sold-panel">
      <p className="section-kicker">
        <HiDocumentCheck /> Sold — settlement
      </p>
      {buyerPaid ? (
        <div className="won-payment-message seller-alert">
          <strong>Buyer paid online.</strong> Admin will verify the transfer and credit{" "}
          <strong>{formatMoney(sellerCredit, slot.currency)}</strong> to your wallet (winning bid minus {sellerFeePercent}% seller fee).
          Choose a handover store below, then bring <strong>{title}</strong> there for the winner.
        </div>
      ) : (
        <p className="muted-copy won-status-note">Waiting for the winner to pay online.</p>
      )}
      <div className="won-info-grid">
        <div className="won-info-item">
          <strong>Winning bid</strong>
          <span>{formatMoney(winningAmount, slot.currency)}</span>
        </div>
        <div className="won-info-item">
          <strong>Seller fee ({sellerFeePercent}%)</strong>
          <span>{formatMoney(Number(slot.seller_fee || winningAmount - sellerCredit), slot.currency)}</span>
        </div>
        <div className="won-info-item">
          <strong>You receive</strong>
          <span>{formatMoney(sellerCredit, slot.currency)}</span>
        </div>
      </div>
      <LockedFeesNote slot={slot} />
      <SellerFeePreviewPanel
        amount={winningAmount}
        currency={slot.currency}
        feePercent={sellerFeePercent}
        formatMoney={formatMoney}
        label="Your wallet credit after seller fee"
      />
    </div>
  );
}

function BidCommentFeed({ bids, currency, emptyCopy }) {
  return (
    <div className="bid-comment-feed">
      <div className="bid-feed-head">
        <HiUserGroup />
        <strong>Bids</strong>
        <span className="soft-badge">{bids.length}</span>
      </div>
      {bids.length ? (
        <ul className="bid-comment-list">
          {bids.map((bid) => (
            <li key={bid.id || `${bid.user_id}-${bid.prize}`}>
              <span className="bid-avatar">{String(bid.name || "?").charAt(0).toUpperCase()}</span>
              <div>
                <p>{bidFeedLine(bid, currency)}</p>
                {bid.created_at ? <small>{new Date(bid.created_at).toLocaleString()}</small> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-copy">{emptyCopy}</p>
      )}
    </div>
  );
}

const LIVE_BID_POLL_MS = 5000;

const AUCTION_TAB_MODES = new Set(["participate", "start", "mine", "won"]);

export function UserAuctionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, profile, wallet, loadingWorkspace, setActionMessage, setWallet, refreshWorkspace, refreshNotifications } = useUserApp();
  const [mode, setMode] = useState(() => {
    const tab = String(searchParams.get("tab") || "").toLowerCase();
    return AUCTION_TAB_MODES.has(tab) ? tab : "participate";
  });
  const [ownedSlots, setOwnedSlots] = useState([]);
  const [liveSlots, setLiveSlots] = useState([]);
  const [wonSlots, setWonSlots] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({
    platform_fee_percent: 0.3,
    seller_fee_percent: 5,
    buyer_fee_percent: 0.3,
    bid_deposit_amount: 500,
    payment_bank_name: "",
    payment_account_title: "",
    payment_account_number: "",
    payment_iban: "",
    payment_instructions: "",
    payment_bank_accounts: [],
  });
  const [cityFilter, setCityFilter] = useState("");
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [registeredOnCnic, setRegisteredOnCnic] = useState(true);
  const [showCreateChecklist, setShowCreateChecklist] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [slotImages, setSlotImages] = useState([]);
  const [cnicImage, setCnicImage] = useState(null);
  const [activeBidSlot, setActiveBidSlot] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [submittingHandoverId, setSubmittingHandoverId] = useState(null);
  const [markingGotId, setMarkingGotId] = useState(null);
  const [walletDialog, setWalletDialog] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);
  const [promptNote, setPromptNote] = useState("");
  const [dialogBusy, setDialogBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [slotForm, setSlotForm] = useState({
    highest_price: "",
    lowest_price: "",
    bike_make: "",
    bike_model: "",
    bike_year: "",
    bike_engine_cc: "",
    bike_color: "",
    bike_mileage: "",
    bike_notes: "",
    cnic_number: "",
    store_id: "",
    city: "",
    currency: "PKR",
    category_id: "",
    item_title: "",
  });

  const cities = useMemo(() => {
    const fromStores = stores.map((s) => s.location?.city).filter(Boolean);
    return [...new Set(fromStores)];
  }, [stores]);

  const depositPreview = useMemo(() => computeBidDepositRequired(platformSettings), [platformSettings]);

  const auctionRequestFields = useMemo(
    () => normalizeAuctionRequestFields(platformSettings.auction_request_fields),
    [platformSettings.auction_request_fields]
  );

  const createFormValidation = useMemo(
    () =>
      buildCreateFormValidation({
        fields: auctionRequestFields,
        slotForm,
        slotImages,
        cnicImage,
        policyAccepted,
        registeredOnCnic,
      }),
    [auctionRequestFields, slotForm, slotImages, cnicImage, policyAccepted, registeredOnCnic]
  );

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (!session?.user_id) return;
    if (silent) setRefreshing(true);
    else setLoadingAuctions(true);
    try {
      const [owned, others, won, storeData, categoryData, settingsData] = await Promise.all([
        getAuctionSlotsByFilter({ userId: session.user_id, scope: "owned", status: "all" }),
        getAuctionSlotsByFilter({ userId: session.user_id, scope: "participable", status: "all" }),
        getAuctionSlotsByFilter({ userId: session.user_id, scope: "won", status: "all" }),
        getStores(),
        getAuctionCategories(),
        getPlatformSettings(),
      ]);
      setOwnedSlots(owned);
      setLiveSlots(others);
      setWonSlots(won);
      setStores(storeData);
      setCategories(categoryData);
      setPlatformSettings(settingsData);
      if (!cityFilter && storeData[0]?.location?.city) {
        setCityFilter(storeData[0].location.city);
      }
      if (!slotForm.category_id && categoryData[0]?.id) {
        setSlotForm((c) => (c.category_id ? c : { ...c, category_id: String(categoryData[0].id) }));
      }
    } finally {
      if (silent) setRefreshing(false);
      else setLoadingAuctions(false);
    }
  }, [session?.user_id, cityFilter, slotForm.category_id]);

  const reloadLiveBids = useCallback(async () => {
    if (!session?.user_id) return;
    try {
      const [owned, others, won] = await Promise.all([
        getAuctionSlotsByFilter({ userId: session.user_id, scope: "owned", status: "all" }),
        getAuctionSlotsByFilter({ userId: session.user_id, scope: "participable", status: "all" }),
        getAuctionSlotsByFilter({ userId: session.user_id, scope: "won", status: "all" }),
      ]);
      setOwnedSlots(owned);
      setLiveSlots(others);
      setWonSlots(won);
    } catch {
      // Keep last good data if a poll fails.
    }
  }, [session?.user_id]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const tab = String(searchParams.get("tab") || "").toLowerCase();
    if (AUCTION_TAB_MODES.has(tab)) {
      setMode(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const auctionId = Number(searchParams.get("auction") || 0);
    if (mode !== "won" || !auctionId) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById(`won-auction-${auctionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [mode, searchParams, wonSlots.length]);

  useEffect(() => {
    if (!session?.user_id) return undefined;
    reloadLiveBids();
    const poll = window.setInterval(() => {
      reloadLiveBids();
      refreshNotifications?.();
    }, LIVE_BID_POLL_MS);
    return () => window.clearInterval(poll);
  }, [session?.user_id, reloadLiveBids, refreshNotifications]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredLive = useMemo(() => {
    if (!cityFilter) return liveSlots;
    return liveSlots.filter((slot) => String(slot.city || "").toLowerCase() === cityFilter.toLowerCase());
  }, [liveSlots, cityFilter]);

  async function handleCreateSlot(event) {
    event.preventDefault();
    setShowCreateChecklist(true);

    const formEl = event.currentTarget;
    const policyFromForm = Boolean(formEl.querySelector('input[name="policy_accepted"]')?.checked);
    const registeredFromForm = Boolean(formEl.querySelector('input[name="registered_on_cnic"]')?.checked);
    if (policyFromForm !== policyAccepted) {
      setPolicyAccepted(policyFromForm);
    }
    if (registeredFromForm !== registeredOnCnic) {
      setRegisteredOnCnic(registeredFromForm);
    }

    const uploadError = getUploadValidationError([...slotImages.slice(0, 4), cnicImage]);
    if (uploadError) {
      setActionMessage({
        type: "error",
        title: "Photo format not supported",
        text: uploadError,
      });
      return;
    }

    const validation = buildCreateFormValidation({
      fields: auctionRequestFields,
      slotForm,
      slotImages,
      cnicImage,
      policyAccepted: policyFromForm,
      registeredOnCnic: registeredFromForm,
    });

    if (!validation.ok) {
      const pending = validation.issues.filter((entry) => !entry.ok);
      const pendingLabels = pending.map((entry) => entry.label);
      if (pending.some((entry) => entry.id === "policy")) {
        formEl.querySelector("#auction-policy-accept")?.scrollIntoView({ behavior: "smooth", block: "center" });
        formEl.querySelector("#auction-policy-accept")?.focus?.();
      }
      setActionMessage({
        type: "error",
        title: "Cannot submit yet",
        text: `Please complete: ${pendingLabels.join(", ")}.`,
      });
      return;
    }

    const highest = Number(slotForm.highest_price);
    const lowest = Number(slotForm.lowest_price);

    try {
      setSubmittingCreate(true);
      const formData = new FormData();
      formData.append("user_id", String(session.user_id));
      formData.append("highest_price", String(highest));
      formData.append("lowest_price", String(lowest));
      formData.append("policy_accepted", policyFromForm ? "true" : "false");
      formData.append("registered_on_cnic", registeredFromForm ? "true" : "false");
      formData.append("cnic_number", slotForm.cnic_number);
      formData.append("store_id", slotForm.store_id);
      formData.append("city", slotForm.city);
      formData.append("currency", slotForm.currency);
      formData.append("category_id", slotForm.category_id);
      formData.append("item_title", slotForm.item_title);
      formData.append("bike_make", slotForm.bike_make);
      formData.append("bike_model", slotForm.bike_model);
      formData.append("bike_year", slotForm.bike_year);
      formData.append("bike_engine_cc", slotForm.bike_engine_cc);
      formData.append("bike_color", slotForm.bike_color);
      formData.append("bike_mileage", slotForm.bike_mileage);
      formData.append("bike_notes", slotForm.bike_notes);
      formData.append("cnic_image", cnicImage);
      slotImages.slice(0, 4).forEach((file, index) => {
        formData.append(`image_${index + 1}`, file);
      });
      await createAuctionSlot(formData);
      setPolicyAccepted(false);
      setRegisteredOnCnic(true);
      setSlotImages([]);
      setCnicImage(null);
      setActionMessage({
        type: "success",
        title: "Auction request submitted",
        text: "Your request is in the admin queue. Review may take up to 48 hours.",
      });
      setMode("mine");
      await reload({ silent: true });
      await reloadLiveBids();
      await refreshWorkspace?.();
      await refreshNotifications?.();
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "Could not submit request",
        text: error.message || "Something went wrong. Check photos (JPG/PNG), store, category, and try again.",
      });
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleCopyPaymentDetail(text, successTitle) {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      setActionMessage({ type: "success", title: successTitle, text: String(text || "") });
    } catch {
      setActionMessage({ type: "info", title: successTitle, text: String(text || "") });
    }
  }

  async function handleStartAuction(slot) {
    try {
      await auctionAction({ auction_id: slot.id, user_id: session.user_id, action: "start" });
      setActionMessage({ type: "success", title: "Auction is live", text: "Your auction is open for up to 3 hours. It will close automatically when time runs out." });
      await reload({ silent: true });
      await reloadLiveBids();
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Could not start auction." });
    }
  }

  async function executeStopAuction(slot) {
    try {
      setDialogBusy(true);
      await auctionAction({
        auction_id: slot.id,
        user_id: session.user_id,
        action: "stop",
        reason: "Stopped by seller without accepting a bid.",
      });
      setActionMessage({
        type: "success",
        title: "Auction stopped",
        text: "The auction was closed without a winner. All bidders were notified.",
      });
      await reload({ silent: true });
      await reloadLiveBids();
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Could not stop auction." });
    } finally {
      setDialogBusy(false);
      setConfirmDialog(null);
    }
  }

  function handleStopAuction(slot) {
    setConfirmDialog({
      variant: "danger",
      title: "Stop this auction?",
      message: "The auction will close without accepting any bid. All bidders will be notified immediately.",
      confirmLabel: "Stop auction",
      onConfirm: () => executeStopAuction(slot),
    });
  }

  async function executeAcceptPrize(slot, bidId) {
    try {
      setDialogBusy(true);
      await auctionAction({
        auction_id: slot.id,
        user_id: session.user_id,
        action: "accept_prize",
        bid_id: bidId,
      });
      setActionMessage({
        type: "success",
        title: "Winning bid accepted",
        text: "The auction is closed. Check notifications for store pickup and payment steps.",
      });
      await reload({ silent: true });
      await reloadLiveBids();
      await refreshWorkspace?.();
      await refreshNotifications?.();
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Could not accept prize." });
    } finally {
      setDialogBusy(false);
      setConfirmDialog(null);
    }
  }

  function handleAcceptPrize(slot, bid) {
    setConfirmDialog({
      variant: "success",
      title: "Accept winning bid?",
      message: `Accept ${bid.name}'s offer of ${formatMoney(bid.prize, slot.currency)} and close auction #${slot.id}? Winner and other bidders will be notified.`,
      confirmLabel: "Accept & close",
      onConfirm: () => executeAcceptPrize(slot, bid.id),
    });
  }

  async function executeSettlement(slot, formType, note) {
    try {
      setDialogBusy(true);
      await auctionAction({
        auction_id: slot.id,
        user_id: session.user_id,
        action: "settlement",
        form_type: formType,
        note,
      });
      setActionMessage({ type: "success", title: "Settlement saved", text: "Your payment confirmation was recorded." });
      await reload({ silent: true });
      await reloadLiveBids();
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Could not save form." });
    } finally {
      setDialogBusy(false);
      setPromptDialog(null);
      setPromptNote("");
    }
  }

  function handleSettlement(slot, formType, paymentAccount = null) {
    const autoNote =
      formType === "user_paid" && paymentAccount
        ? `Paid to ${formatPaymentBankAccountLine(paymentAccount)}`
        : "";
    setPromptNote(autoNote);
    setPromptDialog({ slot, formType, paymentAccount });
  }

  async function handleSetHandoverStore(slot, storeId) {
    try {
      setSubmittingHandoverId(slot.id);
      await auctionAction({
        auction_id: slot.id,
        user_id: session.user_id,
        action: "set_handover_store",
        store_id: Number(storeId),
      });
      setActionMessage({
        type: "success",
        title: "Handover store saved",
        text: "The winner was notified to come to this store and collect the item.",
      });
      await reload({ silent: true });
      await reloadLiveBids();
      await refreshNotifications?.();
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Could not set handover store." });
    } finally {
      setSubmittingHandoverId(null);
    }
  }

  async function handleMarkItemGot(slot) {
    try {
      setMarkingGotId(slot.id);
      await auctionAction({
        auction_id: slot.id,
        user_id: session.user_id,
        action: "mark_item_got",
      });
      setActionMessage({
        type: "success",
        title: "Status set to Got",
        text: "The seller and admin were notified that you received the item.",
      });
      await reload({ silent: true });
      await reloadLiveBids();
      await refreshNotifications?.();
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Could not update status." });
    } finally {
      setMarkingGotId(null);
    }
  }

  async function handlePromptConfirm() {
    if (!promptDialog) return;
    const note =
      promptNote.trim() ||
      (promptDialog.paymentAccount ? `Paid to ${formatPaymentBankAccountLine(promptDialog.paymentAccount)}` : "");
    await executeSettlement(promptDialog.slot, promptDialog.formType, note);
  }

  const activeBidPreview = useMemo(() => {
    if (!activeBidSlot || !bidAmount) return null;
    const slot = liveSlots.find((entry) => entry.id === activeBidSlot);
    if (!slot) return null;
    return {
      slot,
      ...computePriceFeePreview(
        bidAmount,
        slot.buyer_fee_percent ?? slot.platform_fee_percent ?? platformSettings.buyer_fee_percent ?? 0.3
      ),
    };
  }, [activeBidSlot, bidAmount, liveSlots, platformSettings.buyer_fee_percent]);

  const walletBalance = Number(wallet?.remainingBalance || 0);

  function promptWalletRecharge(slot, check) {
    setWalletDialog({
      balance: check.balance ?? walletBalance,
      required: check.required || depositPreview,
      currency: slot?.currency || slotForm.currency || "PKR",
      reason: check.reason,
    });
    const need = formatMoney(check.required?.total || depositPreview.total, slot?.currency || "PKR");
    setActionMessage({
      type: "warning",
      title: "Recharge your wallet",
      text: `You need at least ${need} in your wallet for this bid. Please recharge to take part.`,
      duration: 8000,
    });
  }

  async function handleTakePart(slot) {
    const freshWallet = await getWalletBalance(session.user_id);
    setWallet?.(freshWallet);
    const check = checkWalletForBid({
      wallet: freshWallet,
      platformSettings,
      slot,
      userId: session.user_id,
    });
    if (!check.ok) {
      promptWalletRecharge(slot, check);
      return;
    }
    setActiveBidSlot(slot.id);
    setBidAmount("");
  }

  async function handlePlaceBid(slot) {
    const amount = Number(bidAmount);
    if (!Number.isFinite(amount)) {
      setActionMessage({ type: "error", title: "Invalid bid", text: "Enter a valid bid amount within the listed range." });
      return;
    }
    const freshWallet = await getWalletBalance(session.user_id);
    setWallet?.(freshWallet);
    const walletCheck = checkWalletForBid({
      wallet: freshWallet,
      platformSettings,
      slot,
      userId: session.user_id,
      bidAmount: amount,
    });
    if (!walletCheck.ok) {
      promptWalletRecharge(slot, walletCheck);
      return;
    }
    try {
      setSubmittingBid(true);
      await placeAuctionBid({
        auction_id: slot.id,
        bid_amount: amount,
        user_id: session.user_id,
        bidder_name: profile?.name || "Participant",
        city: cityFilter,
      });
      setBidAmount("");
      setActiveBidSlot(null);
      setActionMessage({
        type: "success",
        title: "Bid placed",
        text: `${profile?.name || "You"}: set bid on ${formatMoney(amount, slot.currency)}`,
      });
      await reloadLiveBids();
      await refreshWorkspace?.();
      await refreshNotifications?.();
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Failed to place bid." });
    } finally {
      setSubmittingBid(false);
    }
  }

  if (loadingWorkspace || loadingAuctions) {
    return (
      <div className="loading-state">
        <div>
          <h3>Loading auction hub</h3>
          <p>Fetching stores, categories, and live auctions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-hub">
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={confirmDialog?.confirmLabel}
        loading={dialogBusy}
        message={confirmDialog?.message}
        onCancel={() => !dialogBusy && setConfirmDialog(null)}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        variant={confirmDialog?.variant || "warning"}
      />
      <PromptDialog
        cancelLabel="Cancel"
        confirmLabel="Save confirmation"
        loading={dialogBusy}
        message={
          promptDialog?.formType === "user_paid"
            ? "Confirm payment. We recorded which bank account you selected. Add an optional transfer reference or note."
            : "Add an optional note for this settlement step. It will be stored with your payment record."
        }
        onCancel={() => !dialogBusy && setPromptDialog(null)}
        onChange={setPromptNote}
        onConfirm={handlePromptConfirm}
        open={Boolean(promptDialog)}
        title="Settlement note"
        value={promptNote}
      />
      <WalletRechargeDialog
        balance={walletDialog?.balance ?? walletBalance}
        currencyLabel={walletDialog?.currency || "PKR"}
        onClose={() => setWalletDialog(null)}
        onGoWallet={() => {
          setWalletDialog(null);
          router.push("/wallet");
        }}
        open={Boolean(walletDialog)}
        reason={walletDialog?.reason}
        required={walletDialog?.required || depositPreview}
      />
      {refreshing ? <div className="auction-refresh-indicator">Syncing live bids and notifications…</div> : null}
      <div className="fee-banner wallet-balance-banner">
        <HiCurrencyDollar />
        <div>
          <strong>Wallet balance: {formatMoney(walletBalance, slotForm.currency)}</strong>
          <p className="muted-copy">
            Your wallet must cover the bid amount. First bid also needs deposit {formatMoney(depositPreview.deposit, slotForm.currency)} + fee{" "}
            {depositPreview.feePct}% ({formatMoney(depositPreview.fee, slotForm.currency)}). Live bids refresh every 5 seconds.
          </p>
        </div>
      </div>

      <div className="mode-switch">
        <button className={mode === "participate" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("participate")} type="button">
          <HiHandRaised /> Take part
        </button>
        <button className={mode === "start" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("start")} type="button">
          <HiBolt /> Start auction
        </button>
        <button className={mode === "mine" ? "mode-pill active" : "mode-pill"} onClick={() => setMode("mine")} type="button">
          <HiCheckCircle /> My requests
        </button>
        <button className={mode === "won" ? "mode-pill active" : wonSlots.length ? "mode-pill mode-pill-highlight" : "mode-pill"} onClick={() => setMode("won")} type="button">
          <HiTrophy /> Won ({wonSlots.length})
        </button>
      </div>

      {wonSlots.length && mode !== "won" ? (
        <div className="won-callout-banner">
          <HiTrophy />
          <div>
            <strong>
              You won {wonSlots.length} auction{wonSlots.length === 1 ? "" : "s"}
            </strong>
            <p className="muted-copy">Open the Won tab for the admin bank account, amount to pay, and pickup steps.</p>
          </div>
          <button className="primary-button" onClick={() => setMode("won")} type="button">
            View won auctions
          </button>
        </div>
      ) : null}

      {mode === "participate" ? (
        <section className="page-grid">
          <article className="section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">City filter</p>
                <h3>Join live auctions</h3>
              </div>
              <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                <option value="">All cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </article>
          <div className="auction-grid auction-grid-wide auction-grid-single">
            {filteredLive.length ? (
              filteredLive.map((slot) => (
                <article className="auction-card auction-card-rich auction-card-xl" key={`live-${slot.id}`}>
                  <div className="auction-card-layout">
                    <div className="auction-card-media">
                      <AuctionGallery label={`Auction #${slot.id}`} size="large" slot={slot} />
                    </div>
                    <div className="auction-card-content">
                  <div className="auction-card-top">
                    <div>
                      <p className="section-kicker">
                        <HiTag /> #{slot.id} · {slot.category_name || "Item"} · {slot.currency}
                      </p>
                      <h3>{slot.item_title || `${slot.bike_make} ${slot.bike_model}`.trim()}</h3>
                      <p className="muted-copy">
                        <HiMapPin /> {slot.city} · {slot.store_name}
                      </p>
                    </div>
                    <AuctionStatusBadge status={slot.auction_status} />
                    <LiveCountdownBadge endDeadlineAt={slot.end_deadline_at} now={now} remainingMs={slot.live_ms_remaining} />
                  </div>
                  <p>
                    Range: {formatMoney(slot.lowest_prize, slot.currency)} – {formatMoney(slot.highest_prize, slot.currency)}
                  </p>
                  <BidCommentFeed
                    bids={slot.participants || []}
                    currency={slot.currency}
                    emptyCopy="No bids yet. Be the first to comment with your offer."
                  />
                  <div className="auction-meta">
                    {activeBidSlot === slot.id ? (
                      <>
                        <div className="inline-actions bid-form-row">
                          <input
                            className="inline-input"
                            min={Number(slot.lowest_prize || 0)}
                            max={Number(slot.highest_prize || 0)}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={`Your bid (${slot.currency})`}
                            type="number"
                            value={bidAmount}
                          />
                          <button className="primary-button" disabled={submittingBid} onClick={() => handlePlaceBid(slot)} type="button">
                            {submittingBid ? "Sending..." : "Place bid"}
                          </button>
                          <button className="secondary-button" onClick={() => setActiveBidSlot(null)} type="button">
                            Cancel
                          </button>
                        </div>
                        {activeBidPreview?.base && activeBidPreview.slot?.id === slot.id ? (
                          <div className="fee-preview-panel bid-fee-preview">
                            <p className="section-kicker">If you win at this bid (buyer only)</p>
                            <div className="fee-preview-grid">
                              <span>Your bid: {formatMoney(activeBidPreview.base, slot.currency)}</span>
                              <span>
                                Purchaser fee ({activeBidPreview.feePercent}%):{" "}
                                {formatMoney(activeBidPreview.buyerFee ?? activeBidPreview.platformFee, slot.currency)}
                              </span>
                              <strong>Total you pay: {formatMoney(activeBidPreview.totalPayAmount, slot.currency)}</strong>
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <button className="primary-button" onClick={() => handleTakePart(slot)} type="button">
                        <HiHandRaised /> Take part
                      </button>
                    )}
                  </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No live auctions" copy="When sellers start approved auctions in your city, they appear here with a live bid feed." />
            )}
          </div>
        </section>
      ) : null}

      {mode === "start" ? (
        <section className="page-grid">
          <article className="section-card policy-card">
            <p className="section-kicker">Auction policy</p>
            <ul className="policy-list">
              {AUCTION_POLICY.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="muted-copy">Accept the policy using the checkbox in the submit form below before sending your request.</p>
          </article>
          <article className="section-card">
            <p className="section-kicker">Submit request</p>
            <CreateFormChecklist showAll={showCreateChecklist} validation={createFormValidation} />
            <form className="form-grid" onSubmit={handleCreateSlot}>
              <AuctionRequestFormFields
                categories={categories}
                cnicImage={cnicImage}
                fields={auctionRequestFields}
                formatMoney={formatMoney}
                platformSettings={platformSettings}
                registeredOnCnic={registeredOnCnic}
                setCnicImage={setCnicImage}
                setRegisteredOnCnic={setRegisteredOnCnic}
                setSlotForm={setSlotForm}
                setSlotImages={setSlotImages}
                slotForm={slotForm}
                slotImages={slotImages}
                stores={stores}
              />
              <p className="full-span muted-copy fee-preview-note">
                Seller fee is deducted from your wallet credit when the sale settles. Only your side of the fee is shown here.
              </p>
              <label className={`full-span checkbox-row policy-checkbox-row create-policy-row${policyAccepted ? " create-policy-row-ok" : ""}`}>
                <input
                  checked={policyAccepted}
                  id="auction-policy-accept"
                  name="policy_accepted"
                  onChange={(e) => setPolicyAccepted(e.target.checked)}
                  type="checkbox"
                  value="true"
                />
                <span>
                  <strong>I have read and accept the auction policy</strong>
                  <small className="muted-copy">Required — check this box, then tap Submit request.</small>
                </span>
              </label>
              <div className="full-span create-form-submit-row">
                <div className="quick-actions">
                  <button className="primary-button" disabled={submittingCreate} type="submit">
                    {submittingCreate ? "Submitting..." : "Submit request"}
                  </button>
                </div>
                {!createFormValidation.ok && !submittingCreate ? (
                  <p className="create-form-submit-hint">
                    {createFormValidation.issues.filter((entry) => !entry.ok).length} step(s) still missing — see the checklist above. Common ones:{" "}
                    <strong>policy checkbox</strong> (just above this button), <strong>4 photos</strong>, <strong>CNIC upload</strong>.
                  </p>
                ) : null}
              </div>
            </form>
          </article>
        </section>
      ) : null}

      {mode === "mine" ? (
        <section className="owned-slots-section">
          <header className="owned-slots-head">
            <div>
              <p className="section-kicker">Your auctions</p>
              <h3>Manage requests & live sales</h3>
              <p className="muted-copy">Track review status, live bid feeds, and settlement steps in one place.</p>
            </div>
          </header>

          {ownedSlots.length ? (
            <div className="owned-slots-grid">
              {ownedSlots.map((slot) => {
                const remaining = slot.start_deadline_at
                  ? Math.max(0, new Date(slot.start_deadline_at).getTime() - now)
                  : 0;
                const showTimer = slot.auction_status === "approved" && remaining > 0;
                const title = slot.item_title || `${slot.bike_make} ${slot.bike_model}`.trim();

                return (
                  <article className="owned-slot-card" key={`owned-${slot.id}`}>
                    <header className="owned-slot-header">
                      <div className="owned-slot-title">
                        <p className="section-kicker">
                          <HiTag /> #{slot.id} · {slot.category_name || "Item"} · {slot.currency}
                        </p>
                        <h4>{title}</h4>
                        <p className="muted-copy">
                          <HiMapPin /> {slot.city} · {slot.store_name}
                        </p>
                        <p className="owned-slot-range">
                          Range {formatMoney(slot.lowest_prize, slot.currency)} – {formatMoney(slot.highest_prize, slot.currency)}
                        </p>
                      </div>
                      <div className="owned-slot-badges">
                        <AuctionStatusBadge status={slot.auction_status} />
                        <LiveCountdownBadge endDeadlineAt={slot.end_deadline_at} now={now} remainingMs={slot.live_ms_remaining} />
                        {showTimer ? (
                          <span className="countdown-badge">
                            <HiClock /> Start within {formatCountdown(remaining)}
                          </span>
                        ) : null}
                      </div>
                    </header>

                    {slot.auction_status === "live" ? (
                      <div className="owned-slot-live">
                        <div className="owned-slot-gallery-row">
                          <AuctionGallery label={`Your auction #${slot.id}`} size="large" slot={slot} />
                        </div>

                        <div className="owned-slot-split">
                          <BidCommentFeed
                            bids={slot.participants || []}
                            currency={slot.currency}
                            emptyCopy="No bids yet. Share your live auction so bidders can join."
                          />
                          <div className="owned-slot-stop-panel action-panel action-panel-danger">
                            <div className="action-panel-head">
                              <HiStopCircle />
                              <div>
                                <strong>Stop without winner</strong>
                                <p className="muted-copy">Close the auction and notify all bidders.</p>
                              </div>
                            </div>
                            <button className="secondary-button danger-outline full-width-btn" onClick={() => handleStopAuction(slot)} type="button">
                              <HiStopCircle /> Stop auction
                            </button>
                          </div>
                        </div>

                        {slot.participants?.length ? (
                          <section className="owned-slot-accept-section">
                            <div className="action-panel-head">
                              <HiTrophy />
                              <div>
                                <strong>Accept a winning bid</strong>
                                <p className="muted-copy">Select one offer below to close the sale and notify everyone.</p>
                              </div>
                            </div>
                            <div className="bid-accept-grid bid-accept-grid-wide">
                              {slot.participants.map((bid) => (
                                <button
                                  className="bid-accept-btn"
                                  key={bid.id}
                                  onClick={() => handleAcceptPrize(slot, bid)}
                                  type="button"
                                >
                                  <span className="bid-accept-icon">
                                    <HiCheckCircle />
                                  </span>
                                  <span className="bid-accept-amount">{formatMoney(bid.prize, slot.currency)}</span>
                                  <span className="bid-accept-name">{bid.name}</span>
                                </button>
                              ))}
                            </div>
                          </section>
                        ) : null}
                      </div>
                    ) : null}

                    {slot.auction_status === "approved" ? (
                      <div className="owned-slot-footer">
                        <button className="primary-button" onClick={() => handleStartAuction(slot)} type="button">
                          <HiBolt /> Start auction now
                        </button>
                      </div>
                    ) : null}

                    {slot.auction_status === "completed" ? (
                      <>
                        <SellerSoldPanel formatMoney={formatMoney} slot={slot} />
                        {slot.payment_forms?.userPaid?.confirmed ? (
                          <SellerHandoverPanel
                            formatMoney={formatMoney}
                            onSetHandover={handleSetHandoverStore}
                            slot={slot}
                            stores={stores}
                            submitting={submittingHandoverId === slot.id}
                          />
                        ) : null}
                        <div className="owned-slot-footer settlement-footer">
                          <p className="section-kicker">
                            <HiShieldCheck /> Confirm settlement
                          </p>
                          <div className="settlement-actions">
                            <button className="settlement-btn" disabled type="button">
                              <HiWallet />
                              <span>{slot.payment_forms?.userPaid?.confirmed ? "Buyer paid ✓" : "Waiting for buyer payment"}</span>
                            </button>
                            <button className="settlement-btn" disabled type="button">
                              <HiDocumentCheck />
                              <span>
                                {slot.payment_forms?.counterpartyCredited?.confirmed
                                  ? `Wallet credited ✓ (${formatMoney(
                                      slot.payment_forms?.counterpartyCredited?.creditAmount || slot.seller_credit_amount,
                                      slot.currency
                                    )})`
                                  : "Admin will credit your wallet after verifying buyer payment"}
                              </span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}

                    {["pending_review", "rejected", "expired", "stopped"].includes(slot.auction_status) ? (
                      <div className="owned-slot-footer">
                        <p className="muted-copy">
                          {slot.auction_status === "pending_review"
                            ? "Waiting for admin review (up to 48 hours)."
                            : slot.auction_status === "approved"
                              ? null
                              : "This request is no longer active."}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No requests yet" copy="Submit an item from the Start auction tab." />
          )}
        </section>
      ) : null}

      {mode === "won" ? (
        <section className="owned-slots-section">
          <header className="owned-slots-head">
            <div>
              <p className="section-kicker">Your wins</p>
              <h3>Auctions you won</h3>
              <p className="muted-copy">
                Pay the admin bank account shown on each win, then tap I paid online. Pickup store comes from the seller after payment.
              </p>
            </div>
          </header>

          {wonSlots.length ? (
            <div className="owned-slots-grid">
              {wonSlots.map((slot) => (
                <WonAuctionCard
                  formatMoney={formatMoney}
                  key={`won-${slot.id}`}
                  markingGot={markingGotId === slot.id}
                  onCopy={handleCopyPaymentDetail}
                  onMarkItemGot={handleMarkItemGot}
                  onSettlement={handleSettlement}
                  platformSettings={platformSettings}
                  slot={slot}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              copy="When a seller accepts your bid, the auction appears here with store pickup and payment steps."
              title="No won auctions yet"
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
