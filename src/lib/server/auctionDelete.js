import {
  AuctionBid,
  AuctionBidDeposit,
  AuctionSlot,
  AuctionSlotStatus,
  NotificationEvent,
} from "@/lib/server/models";

export async function purgeAuctionById(auctionId) {
  const slot = await AuctionSlot.findOne({ legacyId: auctionId });
  const status = await AuctionSlotStatus.findOne({ auctionId });

  if (!slot && !status) {
    throw new Error("Auction not found.");
  }

  const bidCount = await AuctionBid.countDocuments({ auctionId });
  const depositCount = await AuctionBidDeposit.countDocuments({ auctionId });

  const [bidsResult, depositsResult, notificationsResult, statusResult, slotResult] = await Promise.all([
    AuctionBid.deleteMany({ auctionId }),
    AuctionBidDeposit.deleteMany({ auctionId }),
    NotificationEvent.deleteMany({ "metadata.auctionId": auctionId }),
    AuctionSlotStatus.deleteOne({ auctionId }),
    AuctionSlot.deleteOne({ legacyId: auctionId }),
  ]);

  return {
    auction_id: auctionId,
    deleted: {
      slot: slotResult.deletedCount > 0,
      status: statusResult.deletedCount > 0,
      bids: bidsResult.deletedCount,
      deposits: depositsResult.deletedCount,
      notifications: notificationsResult.deletedCount,
    },
    summary: {
      bid_count: bidCount,
      deposit_count: depositCount,
      item_title: slot?.itemTitle || `${slot?.bikeMake || ""} ${slot?.bikeModel || ""}`.trim(),
      auction_status: status?.auctionStatus || "unknown",
    },
  };
}
