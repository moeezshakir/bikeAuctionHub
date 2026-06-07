import { resolveAuctionImagePath } from "@/lib/auctionImages";
import { serializePaymentBankAccountsApi } from "@/lib/paymentBankAccounts";
import { resolveSettlementForAuction } from "@/lib/server/platformSettings";

const START_WINDOW_MS = 6 * 60 * 60 * 1000;
const LIVE_DURATION_MS = 3 * 60 * 60 * 1000;
const REVIEW_DISPLAY_MS = 48 * 60 * 60 * 1000;
const MAX_STARTS_PER_DAY = 3;

const LEGACY_ACCEPTED = "accepted";
const LEGACY_REJECTED = "rejected";
const LEGACY_PENDING = "pending";

export function normalizeStatus(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "accepted" || value === "approved") return "approved";
  if (value === "rejected") return "rejected";
  if (value === "expired") return "expired";
  if (value === "stopped" || value === "cancelled") return "stopped";
  if (value === "live") return "live";
  if (value === "completed") return "completed";
  return "pending_review";
}

export function displayStatus(statusRow) {
  const base = normalizeStatus(statusRow.auctionStatus);
  if (base === "approved" && statusRow.startDeadlineAt && new Date() > new Date(statusRow.startDeadlineAt) && !statusRow.startedAt) {
    return "expired";
  }
  return base;
}

function paymentStepDone(forms, key) {
  return Boolean(forms?.[key]?.confirmed);
}

export function deriveAuctionOutcome(statusRow) {
  const status = displayStatus(statusRow);
  const forms = statusRow.paymentForms || {};
  const stopReason = String(statusRow.stopReason || "").trim();

  if (status === "pending_review") {
    return {
      outcome_status: "pending_review",
      outcome_label: "Awaiting admin review",
      outcome_detail: "In queue for up to 48 hours",
      is_fully_closed: false,
    };
  }
  if (status === "approved") {
    return {
      outcome_status: "approved",
      outcome_label: "Approved — not started",
      outcome_detail: "Seller must start within 6 hours",
      is_fully_closed: false,
    };
  }
  if (status === "expired") {
    return {
      outcome_status: "expired",
      outcome_label: "Start window expired",
      outcome_detail: "Seller did not start the auction in time",
      is_fully_closed: false,
    };
  }
  if (status === "rejected") {
    return {
      outcome_status: "rejected",
      outcome_label: "Rejected by admin",
      outcome_detail: "Request was not approved",
      is_fully_closed: false,
    };
  }
  if (status === "live") {
    return {
      outcome_status: "live",
      outcome_label: "Live — bidding open",
      outcome_detail: "Maximum 3 hours per live session",
      is_fully_closed: false,
    };
  }
  if (status === "stopped") {
    const auto = /auto-closed|3 hours|3-hour|maximum live/i.test(stopReason);
    return {
      outcome_status: auto ? "auto_stopped" : "stopped_no_winner",
      outcome_label: auto ? "Auto-closed — no winner" : "Stopped — no winner",
      outcome_detail: stopReason || "Closed without accepting a winning bid",
      is_fully_closed: false,
    };
  }
  if (status === "completed") {
    const userPaid = paymentStepDone(forms, "userPaid");
    const credited = paymentStepDone(forms, "counterpartyCredited");
    const adminOk = paymentStepDone(forms, "adminConfirmed");

    if (userPaid && credited && adminOk) {
      return {
        outcome_status: "paid_closed",
        outcome_label: "Paid & fully closed",
        outcome_detail: statusRow.fullyClosedAt
          ? `Settlement completed ${new Date(statusRow.fullyClosedAt).toLocaleString()}`
          : "All payment steps confirmed",
        is_fully_closed: true,
      };
    }

    const missing = [];
    if (!userPaid) missing.push("buyer payment");
    if (!credited) missing.push("seller credit");
    if (!adminOk) missing.push("admin confirmation");

    return {
      outcome_status: "settlement_pending",
      outcome_label: userPaid || credited || adminOk ? "Settlement in progress" : "Sold — awaiting payment",
      outcome_detail: `Pending: ${missing.join(", ")}`,
      is_fully_closed: false,
    };
  }

  return {
    outcome_status: "unknown",
    outcome_label: "Unknown",
    outcome_detail: "",
    is_fully_closed: false,
  };
}

export function isSettlementFullyClosed(paymentForms = {}) {
  return (
    paymentStepDone(paymentForms, "userPaid") &&
    paymentStepDone(paymentForms, "counterpartyCredited") &&
    paymentStepDone(paymentForms, "adminConfirmed")
  );
}

export function isLiveAuctionExpired(statusRow, now = new Date()) {
  const endAt = computeLiveEndAt(statusRow);
  if (!endAt) return false;
  return endAt.getTime() <= now.getTime();
}

export async function syncAuctionExpiry(AuctionSlotStatus) {
  const now = new Date();
  const rows = await AuctionSlotStatus.find({
    auctionStatus: { $in: ["Accepted", "approved", "Approved"] },
    startedAt: null,
    startDeadlineAt: { $ne: null, $lt: now },
  });

  await Promise.all(
    rows.map((row) => {
      row.auctionStatus = "expired";
      return row.save();
    })
  );

  const stalePending = await AuctionSlotStatus.find({
    auctionStatus: { $in: ["pending", "pending_review", "Pending"] },
    submittedAt: { $ne: null, $lt: new Date(now.getTime() - REVIEW_DISPLAY_MS) },
  });

  return { expiredStarts: rows.length, stalePending: stalePending.length };
}

export function computeLiveEndAt(statusRow) {
  if (statusRow?.endDeadlineAt) {
    return new Date(statusRow.endDeadlineAt);
  }
  if (statusRow?.startedAt) {
    return new Date(new Date(statusRow.startedAt).getTime() + LIVE_DURATION_MS);
  }
  return null;
}

export function serializeAuction(slot, statusRow, user, bids = [], store = null, platform = null, handoverStore = null) {
  const status = displayStatus(statusRow);
  const now = Date.now();
  const startDeadline = statusRow.startDeadlineAt ? new Date(statusRow.startDeadlineAt).getTime() : null;
  const liveEnd = computeLiveEndAt(statusRow);
  const liveEndMs = liveEnd ? liveEnd.getTime() : null;
  const reviewDeadline = statusRow.submittedAt
    ? new Date(statusRow.submittedAt).getTime() + REVIEW_DISPLAY_MS
    : null;
  const currency = statusRow.currency || "PKR";
  const sortedBids = [...bids].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  const highestBid = sortedBids.length
    ? sortedBids.reduce((max, bid) => (Number(bid.prize) > Number(max.prize) ? bid : max), sortedBids[0])
    : null;
  const winningBid =
    statusRow.winnerUserId != null
      ? sortedBids.find((bid) => Number(bid.user_id) === Number(statusRow.winnerUserId)) ||
        (statusRow.winningBidId
          ? sortedBids.find((bid) => String(bid.id) === String(statusRow.winningBidId))
          : null)
      : null;
  const winningAmount = winningBid ? Number(winningBid.prize) : null;
  let settlementFee = null;
  let buyerFee = null;
  let sellerFee = null;
  let totalPayAmount = null;
  let sellerCreditAmount = null;
  let sellerFeePercent = null;
  let buyerFeePercent = null;
  let feesLockedAtSale = false;
  let settlementLockedAt = null;

  const settlement = resolveSettlementForAuction(statusRow, winningAmount, platform);
  if (settlement) {
    settlementFee = settlement.buyerFee;
    buyerFee = settlement.buyerFee;
    sellerFee = settlement.sellerFee;
    totalPayAmount = settlement.totalPayAmount;
    sellerCreditAmount = settlement.sellerCreditAmount;
    sellerFeePercent = settlement.sellerFeePercent;
    buyerFeePercent = settlement.buyerFeePercent;
    feesLockedAtSale = Boolean(settlement.fromSnapshot);
    settlementLockedAt = statusRow.settlementSnapshot?.lockedAt || null;
  }
  const outcome = deriveAuctionOutcome(statusRow);

  return {
    id: slot.legacyId,
    image_1: resolveAuctionImagePath(slot.image1, 0),
    image_2: slot.image2 ? resolveAuctionImagePath(slot.image2, 1) : null,
    image_3: slot.image3 ? resolveAuctionImagePath(slot.image3, 2) : null,
    image_4: slot.image4 ? resolveAuctionImagePath(slot.image4, 3) : null,
    cnic_image: statusRow.cnicImagePath || null,
    highest_prize: slot.highestPrize,
    lowest_prize: slot.lowestPrize,
    currency,
    category_id: slot.categoryId || null,
    category_name: slot.categoryName || "",
    item_title: slot.itemTitle || "",
    user_id: statusRow.userId,
    username: user?.name || "Unknown",
    auction_status: status,
    bike_make: slot.bikeMake || "",
    bike_model: slot.bikeModel || "",
    bike_year: slot.bikeYear || "",
    bike_engine_cc: slot.bikeEngineCc || "",
    bike_color: slot.bikeColor || "",
    bike_mileage: slot.bikeMileage || "",
    bike_notes: slot.bikeNotes || "",
    cnic_number: statusRow.cnicNumber || "",
    registered_on_cnic: Boolean(statusRow.registeredOnCnic),
    policy_accepted_at: statusRow.policyAcceptedAt || null,
    store_id: statusRow.storeId || null,
    city: statusRow.city || store?.location?.city || "",
    store_name: store?.storeName || "",
    store_address: store?.location?.address || "",
    submitted_at: statusRow.submittedAt || null,
    review_deadline_at: reviewDeadline ? new Date(reviewDeadline).toISOString() : null,
    approved_at: statusRow.approvedAt || null,
    start_deadline_at: statusRow.startDeadlineAt || null,
    start_ms_remaining: status === "approved" && startDeadline ? Math.max(0, startDeadline - now) : 0,
    started_at: statusRow.startedAt || null,
    end_deadline_at: liveEnd ? liveEnd.toISOString() : null,
    live_ms_remaining: status === "live" && liveEndMs ? Math.max(0, liveEndMs - now) : 0,
    live_duration_hours: LIVE_DURATION_MS / (60 * 60 * 1000),
    completed_at: statusRow.completedAt || null,
    stopped_at: statusRow.stoppedAt || null,
    stop_reason: statusRow.stopReason || "",
    winning_bid_id: statusRow.winningBidId || null,
    winner_user_id: statusRow.winnerUserId || null,
    winning_bid: winningBid,
    winning_bid_amount: winningAmount,
    settlement_fee: settlementFee,
    buyer_fee: buyerFee,
    seller_fee: sellerFee,
    total_pay_amount: totalPayAmount,
    seller_credit_amount: sellerCreditAmount,
    highest_bid: highestBid,
    platform_fee_percent: buyerFeePercent ?? platform?.buyerFeePercent ?? 0.3,
    buyer_fee_percent: buyerFeePercent ?? platform?.buyerFeePercent ?? 0.3,
    seller_fee_percent: sellerFeePercent ?? platform?.platformFeePercent ?? 5,
    fees_locked_at_sale: feesLockedAtSale,
    settlement_locked_at: settlementLockedAt,
    bid_deposit_amount: platform?.bidDepositAmount ?? 500,
    payment_bank_name: platform?.paymentBankName || "",
    payment_account_title: platform?.paymentAccountTitle || "",
    payment_account_number: platform?.paymentAccountNumber || "",
    payment_iban: platform?.paymentIban || "",
    payment_instructions: platform?.paymentInstructions || "",
    payment_bank_accounts: serializePaymentBankAccountsApi(platform?.paymentBankAccounts),
    payment_forms: statusRow.paymentForms || {},
    participants: sortedBids,
    outcome_status: outcome.outcome_status,
    outcome_label: outcome.outcome_label,
    outcome_detail: outcome.outcome_detail,
    is_fully_closed: outcome.is_fully_closed,
    fully_closed_at: statusRow.fullyClosedAt || null,
    handover_store_id: statusRow.handoverStoreId || null,
    handover_store_name: handoverStore?.storeName || "",
    handover_store_address: handoverStore?.location?.address || "",
    handover_set_at: statusRow.handoverSetAt || null,
    item_received: Boolean(statusRow.winnerItemReceivedAt),
    item_received_at: statusRow.winnerItemReceivedAt || null,
  };
}

export async function countStartsToday(AuctionSlotStatus, userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return AuctionSlotStatus.countDocuments({
    userId,
    startedAt: { $gte: startOfDay },
  });
}

export { START_WINDOW_MS, LIVE_DURATION_MS, REVIEW_DISPLAY_MS, MAX_STARTS_PER_DAY, LEGACY_ACCEPTED, LEGACY_REJECTED, LEGACY_PENDING };
