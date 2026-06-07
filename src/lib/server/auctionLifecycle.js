import { AuctionBid } from "@/lib/server/models";
import { createAdminNotification, createUserNotification } from "@/lib/server/notifications";
import { computeLiveEndAt, isLiveAuctionExpired } from "@/lib/server/auctionHelpers";

export async function stopLiveAuction(slotStatus, { reason, auto = false } = {}) {
  const auctionId = slotStatus.auctionId;
  const stopReason =
    String(reason || "").trim() ||
    (auto
      ? "Auction auto-closed after 3 hours (maximum live duration)."
      : "Stopped by seller without accepting a bid.");

  slotStatus.auctionStatus = "stopped";
  slotStatus.stoppedAt = new Date();
  slotStatus.stopReason = stopReason;
  if (!slotStatus.endDeadlineAt && slotStatus.startedAt) {
    slotStatus.endDeadlineAt = computeLiveEndAt(slotStatus);
  }
  await slotStatus.save();

  const ownerMessage = auto
    ? `Auction #${auctionId} was automatically closed after 3 hours. No winning bid was selected.`
    : `You stopped auction #${auctionId}. No winning bid was selected.`;

  await createUserNotification({
    userId: slotStatus.userId,
    type: auto ? "auction_auto_stopped" : "auction_stopped",
    title: auto ? "Auction time expired" : "Auction stopped",
    message: ownerMessage,
    metadata: { auctionId, auto },
  });

  const bids = await AuctionBid.find({ auctionId });
  await Promise.all(
    bids.map((entry) =>
      createUserNotification({
        userId: entry.userId,
        type: "auction_stopped",
        title: auto ? "Auction time expired" : "Auction ended",
        message: auto
          ? `Auction #${auctionId} reached the 3-hour limit and was closed automatically.`
          : `Auction #${auctionId} was stopped by the seller. Your deposit remains on file for platform records.`,
        metadata: { auctionId, auto },
      })
    )
  );

  await createAdminNotification({
    adminStoreId: slotStatus.storeId || 1,
    type: auto ? "auction_auto_stopped" : "auction_stopped",
    title: auto ? "Auction auto-closed" : "Auction stopped",
    message: auto
      ? `Auction #${auctionId} auto-closed after 3 hours (user #${slotStatus.userId}).`
      : `Auction #${auctionId} stopped by user #${slotStatus.userId}.`,
    metadata: { auctionId, userId: slotStatus.userId, auto },
  });

  return slotStatus;
}

export async function syncLiveAuctionExpiry(AuctionSlotStatus) {
  const now = new Date();
  const liveRows = await AuctionSlotStatus.find({
    auctionStatus: { $in: ["live", "Live"] },
  });

  let closed = 0;
  for (const row of liveRows) {
    if (!isLiveAuctionExpired(row, now)) continue;
    if (!row.endDeadlineAt && row.startedAt) {
      row.endDeadlineAt = computeLiveEndAt(row);
    }
    await stopLiveAuction(row, { auto: true });
    closed += 1;
  }

  return { closed };
}
