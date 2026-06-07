const AUCTION_STATUS_LABELS = {
  pending_review: "In queue (up to 48h)",
  approved: "Approved — start within 6h",
  rejected: "Rejected",
  expired: "Start window expired",
  live: "Live",
  completed: "Completed (sold)",
  stopped: "Stopped",
};

const OUTCOME_PILL_CLASS = {
  paid_closed: "success",
  settlement_pending: "warning",
  sold_awaiting_payment: "info",
  stopped_no_winner: "neutral",
  auto_stopped: "neutral",
  rejected: "danger",
  expired: "danger",
  live: "live",
  pending_review: "warning",
  approved: "info",
  unknown: "neutral",
};

const AUCTION_STATUS_PILL_CLASS = {
  pending_review: "warning",
  approved: "info",
  rejected: "danger",
  expired: "danger",
  live: "live",
  completed: "success",
  stopped: "neutral",
};

export function auctionStatusLabel(status) {
  return AUCTION_STATUS_LABELS[status] || status || "Unknown";
}

export function auctionStatusPillClass(status) {
  return AUCTION_STATUS_PILL_CLASS[status] || "warning";
}

export function outcomeStatusPillClass(outcomeStatus) {
  return OUTCOME_PILL_CLASS[outcomeStatus] || "neutral";
}
