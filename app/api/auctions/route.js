import { connectToDatabase } from "@/lib/server/mongodb";
import {
  AuctionBid,
  AuctionBidDeposit,
  AuctionCategory,
  AuctionSlot,
  AuctionSlotStatus,
  RentalStore,
  UserProfile,
  Wallet,
} from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";
import { createAdminNotification, createUserNotification } from "@/lib/server/notifications";
import {
  countStartsToday,
  isSettlementFullyClosed,
  LIVE_DURATION_MS,
  MAX_STARTS_PER_DAY,
  serializeAuction,
  START_WINDOW_MS,
  syncAuctionExpiry,
} from "@/lib/server/auctionHelpers";
import { stopLiveAuction, syncLiveAuctionExpiry } from "@/lib/server/auctionLifecycle";
import {
  ALLOWED_CURRENCIES,
  computeBidDepositCharge,
  buildSettlementSnapshot,
  resolveSettlementForAuction,
  formatWinnerPaymentNotice,
  getPlatformSettings,
} from "@/lib/server/platformSettings";
import { getActivePaymentBankAccounts } from "@/lib/paymentBankAccounts";
import { purgeAuctionById } from "@/lib/server/auctionDelete";
import { ALLOWED_UPLOAD_EXTENSIONS, resolveUploadExtension } from "@/lib/uploadImages";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function isUploadBlob(file) {
  return Boolean(file && typeof file.arrayBuffer === "function");
}

async function uploadFile(file, folder) {
  if (!isUploadBlob(file)) {
    return null;
  }

  let ext = resolveUploadExtension(file);
  if (!ext || !ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    const label = file.name || file.type || "file";
    throw new Error(`Unsupported image format for "${label}". Use JPG, PNG, WEBP, GIF, HEIC, or BMP.`);
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${randomUUID()}${ext}`;
  const diskPath = path.join(uploadDir, fileName);
  const bytes = await file.arrayBuffer();
  await writeFile(diskPath, Buffer.from(bytes));
  return `uploads/${folder}/${fileName}`;
}

function createAuctionFail(error, fallback = "Failed to create auction request") {
  const message = error?.message || fallback;
  if (/unsupported image|upload|format|required|must|select|valid/i.test(message)) {
    return fail(message, 422);
  }
  return fail(fallback, 500, message);
}

async function loadAuctionBundle(auctionIds) {
  const statuses = await AuctionSlotStatus.find({ auctionId: { $in: auctionIds } });
  const slots = await AuctionSlot.find({ legacyId: { $in: auctionIds } });
  const userIds = statuses.map((entry) => entry.userId);
  const storeIds = [
    ...new Set(
      statuses.flatMap((entry) => [entry.storeId, entry.handoverStoreId].filter(Boolean))
    ),
  ];
  const [users, stores, bids] = await Promise.all([
    UserProfile.find({ legacyId: { $in: userIds } }),
    RentalStore.find({ legacyId: { $in: storeIds } }),
    AuctionBid.find({ auctionId: { $in: auctionIds } }).sort({ createdAt: -1 }),
  ]);
  return {
    statuses,
    slotMap: new Map(slots.map((slot) => [slot.legacyId, slot])),
    userMap: new Map(users.map((user) => [user.legacyId, user])),
    storeMap: new Map(stores.map((store) => [store.legacyId, store])),
    bidsByAuction: bids.reduce((acc, bid) => {
      const list = acc.get(bid.auctionId) || [];
      list.push({
        id: String(bid._id),
        user_id: bid.userId,
        name: bid.bidderName || `User #${bid.userId}`,
        prize: bid.bidAmount,
        created_at: bid.createdAt,
      });
      acc.set(bid.auctionId, list);
      return acc;
    }, new Map()),
  };
}

export async function GET(request) {
  try {
    await connectToDatabase();
    await syncAuctionExpiry(AuctionSlotStatus);
    await syncLiveAuctionExpiry(AuctionSlotStatus);

    const { searchParams } = new URL(request.url);
    const statusFilter = String(searchParams.get("status") || "all").toLowerCase();
    const userIdFilter = Number(searchParams.get("userId") || 0);
    const scope = String(searchParams.get("scope") || "all").toLowerCase();
    const cityFilter = String(searchParams.get("city") || "").trim().toLowerCase();
    const report = searchParams.get("report") === "success";

    let statuses = await AuctionSlotStatus.find().sort({ submittedAt: -1, auctionId: -1 });

    if (report) {
      statuses = statuses.filter((entry) => ["completed", "Completed"].includes(String(entry.auctionStatus)));
    }

    const filteredStatuses = statuses.filter((entry) => {
      const serialized = serializeAuction(
        { legacyId: entry.auctionId },
        entry,
        null,
        []
      );
      const normalized = serialized.auction_status;

      if (statusFilter !== "all") {
        if (statusFilter === "pending" && normalized !== "pending_review") return false;
        if (statusFilter !== "pending" && normalized !== statusFilter) return false;
      }
      if (cityFilter && String(entry.city || "").toLowerCase() !== cityFilter) {
        return false;
      }
      if (!userIdFilter) return true;
      if (scope === "owned") return entry.userId === userIdFilter;
      if (scope === "others") {
        return entry.userId !== userIdFilter && ["live", "completed"].includes(normalized);
      }
      if (scope === "participable") {
        return entry.userId !== userIdFilter && normalized === "live";
      }
      if (scope === "won") {
        return Number(entry.winnerUserId) === userIdFilter && normalized === "completed";
      }
      return true;
    });

    const auctionIds = filteredStatuses.map((entry) => entry.auctionId);
    const { slotMap, userMap, storeMap, bidsByAuction } = await loadAuctionBundle(auctionIds);
    const platform = await getPlatformSettings();

    return ok({
      status: true,
      auctionData: filteredStatuses
        .map((entry) => {
          const slot = slotMap.get(entry.auctionId);
          if (!slot) return null;
          return serializeAuction(
            slot,
            entry,
            userMap.get(entry.userId),
            bidsByAuction.get(slot.legacyId) || [],
            storeMap.get(entry.storeId),
            platform,
            storeMap.get(entry.handoverStoreId)
          );
        })
        .filter(Boolean),
    });
  } catch (error) {
    return fail("Failed to load auctions", 500, error.message);
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    await syncAuctionExpiry(AuctionSlotStatus);
    await syncLiveAuctionExpiry(AuctionSlotStatus);
    const body = await request.json();

    if (body.auction_id) {
      const auctionId = Number(body.auction_id);
      const bidderUserId = Number(body.user_id);
      const bidderName = String(body.bidder_name || "").trim();
      const bidAmount = Number(body.bid_amount);
      const bidderCity = String(body.city || "").trim().toLowerCase();

      if (!auctionId || !bidderUserId || !Number.isFinite(bidAmount) || bidAmount <= 0) {
        return fail("Auction id, user, and valid bid amount are required.", 422);
      }

      const slot = await AuctionSlot.findOne({ legacyId: auctionId });
      let slotStatus = await AuctionSlotStatus.findOne({ auctionId });
      if (!slot || !slotStatus) {
        return fail("Auction slot not found.", 404);
      }

      const view = serializeAuction(slot, slotStatus, null, []);
      if (view.auction_status !== "live") {
        return fail("Auction is not live. Only live auctions accept bids.", 409);
      }
      if (slotStatus.userId === bidderUserId) {
        return fail("You cannot bid on your own auction.", 422);
      }
      if (bidderCity && String(slotStatus.city || "").toLowerCase() !== bidderCity) {
        return fail("Select the same city as this auction to participate.", 422);
      }
      if (bidAmount < Number(slot.lowestPrize || 0) || bidAmount > Number(slot.highestPrize || 0)) {
        return fail("Bid amount must be within the slot price range.", 422);
      }

      const currency = slotStatus.currency || "PKR";
      const platform = await getPlatformSettings();
      const existingDeposit = await AuctionBidDeposit.findOne({ auctionId, userId: bidderUserId });

      let wallet = await Wallet.findOne({ userId: bidderUserId });
      if (!wallet) {
        wallet = await Wallet.create({ legacyId: bidderUserId, userId: bidderUserId, remainingBalance: 0 });
      }
      const balance = Number(wallet.remainingBalance || 0);

      if (!existingDeposit) {
        const charge = computeBidDepositCharge(platform.bidDepositAmount, platform);
        const requiredTotal = bidAmount + charge.total;
        if (balance < requiredTotal) {
          return fail(
            `Insufficient wallet balance. You need at least ${requiredTotal} ${currency} (${bidAmount} bid + ${charge.total} deposit and fee). Your balance: ${balance}. Please recharge your wallet.`,
            402
          );
        }
        wallet.remainingBalance = balance - charge.total;
        await wallet.save();
        await AuctionBidDeposit.create({
          auctionId,
          userId: bidderUserId,
          depositAmount: charge.deposit,
          platformFee: charge.platformFee,
          currency,
        });
      } else if (balance < bidAmount) {
        return fail(
          `Insufficient wallet balance for this bid. You need at least ${bidAmount} ${currency} in your wallet. Your balance: ${balance}. Please recharge your wallet.`,
          402
        );
      }

      await AuctionBid.create({
        auctionId,
        userId: bidderUserId,
        bidderName: bidderName || `User #${bidderUserId}`,
        bidAmount,
      });

      const bidMessage = `${bidderName || `User #${bidderUserId}`}: set bid on ${bidAmount} ${currency}.`;

      await createUserNotification({
        userId: slotStatus.userId,
        type: "auction_bid",
        title: "New bid on your auction",
        message: `${bidMessage} Auction #${auctionId}.`,
        metadata: { auctionId, bidAmount, bidderUserId, currency },
      });

      const previousBidders = await AuctionBid.find({
        auctionId,
        userId: { $nin: [bidderUserId, slotStatus.userId] },
      }).select("userId");
      const watcherIds = [...new Set(previousBidders.map((entry) => entry.userId))];

      await Promise.all(
        watcherIds.map((userId) =>
          createUserNotification({
            userId,
            type: "auction_bid_update",
            title: "New bid placed",
            message: `${bidMessage} Open auction #${auctionId} to see the live feed.`,
            metadata: { auctionId, bidAmount, bidderUserId, currency },
          })
        )
      );

      return ok({
        status: true,
        message: "Bid placed successfully.",
        data: { id: auctionId, bid_amount: bidAmount, currency },
      });
    }

    return fail("Use PUT with multipart form to submit a new auction request.", 422);
  } catch (error) {
    return fail("Failed to process auction request", 500, error.message);
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    await syncAuctionExpiry(AuctionSlotStatus);
    await syncLiveAuctionExpiry(AuctionSlotStatus);
    const body = await request.json();
    const auctionId = Number(body.auction_id);
    const actorUserId = Number(body.user_id);
    const action = String(body.action || "").trim().toLowerCase();

    if (!auctionId || !action) {
      return fail("Auction id and action are required.", 422);
    }

    const slotStatus = await AuctionSlotStatus.findOne({ auctionId });
    const slot = await AuctionSlot.findOne({ legacyId: auctionId });
    if (!slotStatus || !slot) {
      return fail("Auction not found.", 404);
    }

    let view = serializeAuction(slot, slotStatus, null, []);

    if (action === "accept" || action === "reject") {
      if (view.auction_status !== "pending_review") {
        return fail("Only queued requests can be reviewed.", 409);
      }
      if (action === "reject") {
        slotStatus.auctionStatus = "rejected";
        await slotStatus.save();
        await createUserNotification({
          userId: slotStatus.userId,
          type: "auction_rejected",
          title: "Auction request rejected",
          message: `Your auction request #${auctionId} was rejected after admin review.`,
          metadata: { auctionId },
        });
        return ok({ status: true, message: "Auction rejected.", data: { auction_id: auctionId, auction_status: "rejected" } });
      }

      const now = new Date();
      slotStatus.auctionStatus = "approved";
      slotStatus.approvedAt = now;
      slotStatus.startDeadlineAt = new Date(now.getTime() + START_WINDOW_MS);
      await slotStatus.save();

      await createUserNotification({
        userId: slotStatus.userId,
        type: "auction_approved",
        title: "Auction approved",
        message: `Request #${auctionId} approved. Start your auction within 6 hours.`,
        metadata: { auctionId, startDeadlineAt: slotStatus.startDeadlineAt },
      });
      await createAdminNotification({
        adminStoreId: slotStatus.storeId || 1,
        type: "auction_approved",
        title: "Auction approved",
        message: `Auction #${auctionId} approved for user #${slotStatus.userId}.`,
        metadata: { auctionId, userId: slotStatus.userId },
      });

      return ok({
        status: true,
        message: "Auction approved. User has 6 hours to start.",
        data: { auction_id: auctionId, auction_status: "approved", start_deadline_at: slotStatus.startDeadlineAt },
      });
    }

    if (action === "start") {
      if (!actorUserId) {
        return fail("User id is required.", 422);
      }
      if (slotStatus.userId !== actorUserId) {
        return fail("Only the auction owner can start it.", 403);
      }
      if (view.auction_status !== "approved") {
        return fail("Auction cannot be started in its current state.", 409);
      }
      const startsToday = await countStartsToday(AuctionSlotStatus, actorUserId);
      if (startsToday >= MAX_STARTS_PER_DAY) {
        return fail("Daily limit reached. You can start up to 3 auctions per day.", 429);
      }

      const now = new Date();
      slotStatus.auctionStatus = "live";
      slotStatus.startedAt = now;
      slotStatus.endDeadlineAt = new Date(now.getTime() + LIVE_DURATION_MS);
      await slotStatus.save();

      await createUserNotification({
        userId: actorUserId,
        type: "auction_live",
        title: "Auction is live",
        message: `Your auction #${auctionId} is now live for bidders. It will auto-close in 3 hours if no winner is selected.`,
        metadata: { auctionId, endDeadlineAt: slotStatus.endDeadlineAt },
      });

      return ok({
        status: true,
        message: "Auction started. It will run for up to 3 hours.",
        data: {
          auction_id: auctionId,
          auction_status: "live",
          end_deadline_at: slotStatus.endDeadlineAt,
        },
      });
    }

    if (action === "stop") {
      if (!actorUserId) {
        return fail("User id is required.", 422);
      }
      if (slotStatus.userId !== actorUserId) {
        return fail("Only the auction owner can stop it.", 403);
      }
      if (view.auction_status !== "live") {
        return fail("Only live auctions can be stopped.", 409);
      }

      const reason = String(body.reason || "").trim() || "Stopped by seller without accepting a bid.";
      await stopLiveAuction(slotStatus, { reason, auto: false });

      return ok({
        status: true,
        message: "Auction stopped. All bidders were notified.",
        data: { auction_id: auctionId, auction_status: "stopped" },
      });
    }

    if (action === "accept_prize") {
      if (!actorUserId) {
        return fail("User id is required.", 422);
      }
      if (slotStatus.userId !== actorUserId) {
        return fail("Only the auction owner can accept a winning bid.", 403);
      }
      if (view.auction_status !== "live") {
        return fail("Prize can only be accepted on a live auction.", 409);
      }

      const bidId = String(body.bid_id || "");
      const bid = await AuctionBid.findOne({ _id: bidId, auctionId });
      if (!bid) {
        return fail("Select a valid winning bid.", 404);
      }

      slotStatus.auctionStatus = "completed";
      slotStatus.completedAt = new Date();
      slotStatus.winningBidId = bid._id;
      slotStatus.winnerUserId = bid.userId;

      const platform = await getPlatformSettings();
      slotStatus.settlementSnapshot = buildSettlementSnapshot(bid.bidAmount, platform);
      await slotStatus.save();

      const store = slotStatus.storeId ? await RentalStore.findOne({ legacyId: slotStatus.storeId }) : null;
      const pickup = store?.storeName || "Auction store";
      const address = store?.location?.address || "";
      const currency = slotStatus.currency || "PKR";
      const { sellerFee, sellerFeePercent } = resolveSettlementForAuction(slotStatus, bid.bidAmount, platform);
      const winnerPaymentMessage = formatWinnerPaymentNotice(platform, {
        auctionId,
        winningAmount: bid.bidAmount,
        currency,
      });

      await createUserNotification({
        userId: bid.userId,
        type: "auction_won",
        title: "You won — pay to admin bank account",
        message: `${winnerPaymentMessage} Pickup store: ${pickup}${address ? ` (${address})` : ""}.`,
        metadata: {
          auctionId,
          storeId: slotStatus.storeId,
          amount: bid.bidAmount,
          currency,
          payment_bank_name: platform.paymentBankName,
          payment_account_number: platform.paymentAccountNumber,
          payment_iban: platform.paymentIban,
          payment_bank_accounts: getActivePaymentBankAccounts(platform.paymentBankAccounts),
        },
      });

      await createUserNotification({
        userId: slotStatus.userId,
        type: "auction_sold",
        title: "Auction sold",
        message: `Your auction #${auctionId} sold for ${bid.bidAmount} ${currency}. Meet the buyer at ${pickup}. Platform deducts ${sellerFee} ${currency} seller fee (${sellerFeePercent}%) when your wallet is credited.`,
        metadata: { auctionId, winnerUserId: bid.userId, amount: bid.bidAmount, currency },
      });

      const otherBids = await AuctionBid.find({ auctionId, userId: { $ne: bid.userId } });
      await Promise.all(
        otherBids.map((entry) =>
          createUserNotification({
            userId: entry.userId,
            type: "auction_lost",
            title: "Auction closed",
            message: `Auction #${auctionId} ended. Another bidder was selected.`,
            metadata: { auctionId },
          })
        )
      );

      await createAdminNotification({
        adminStoreId: slotStatus.storeId || 1,
        type: "auction_completed",
        title: "Auction completed",
        message: `Auction #${auctionId} completed. Winner user #${bid.userId}.`,
        metadata: { auctionId, winnerUserId: bid.userId, amount: bid.bidAmount },
      });

      return ok({
        status: true,
        message: "Winning bid accepted. Settlement forms are now available.",
        data: { auction_id: auctionId, auction_status: "completed", winner_user_id: bid.userId },
      });
    }

    if (action === "set_handover_store") {
      if (!actorUserId) {
        return fail("User id is required.", 422);
      }
      if (slotStatus.userId !== actorUserId) {
        return fail("Only the seller can set the handover store.", 403);
      }
      if (view.auction_status !== "completed") {
        return fail("Handover store can only be set after the auction is completed.", 409);
      }

      const handoverStoreId = Number(body.store_id);
      if (!handoverStoreId) {
        return fail("Select a valid handover store.", 422);
      }

      const handoverStore = await RentalStore.findOne({ legacyId: handoverStoreId });
      if (!handoverStore) {
        return fail("Handover store not found.", 404);
      }

      slotStatus.handoverStoreId = handoverStoreId;
      slotStatus.handoverSetAt = new Date();
      await slotStatus.save();

      const platform = await getPlatformSettings();
      const currency = slotStatus.currency || "PKR";
      const winningBid = slotStatus.winningBidId
        ? await AuctionBid.findById(slotStatus.winningBidId)
        : await AuctionBid.findOne({ auctionId, userId: slotStatus.winnerUserId }).sort({ bidAmount: -1 });
      const { winningAmount, buyerFee, totalPayAmount, buyerFeePercent, sellerFeePercent } = resolveSettlementForAuction(
        slotStatus,
        winningBid?.bidAmount,
        platform
      ) || {};
      const itemTitle =
        slot.itemTitle?.trim() || `${slot.bikeMake || ""} ${slot.bikeModel || ""}`.trim() || `Auction #${auctionId}`;
      const storeName = handoverStore.storeName || "Auction store";
      const storeAddress = handoverStore.location?.address || handoverStore.location?.city || "";
      const addressLine = storeAddress ? `${storeName}, ${storeAddress}` : storeName;

      if (slotStatus.winnerUserId) {
        await createUserNotification({
          userId: slotStatus.winnerUserId,
          type: "pickup_ready",
          title: "Come to the store — collect your item",
          message: `Auction #${auctionId} (${itemTitle}): the seller will hand over your item at ${addressLine}. Come to this store to collect it. You paid bid ${winningAmount} ${currency} plus ${buyerFee} ${currency} purchaser fee (${buyerFeePercent}%) = ${totalPayAmount} ${currency} total. After you receive the item, mark status as Got in the Won tab.`,
          metadata: {
            auctionId,
            handoverStoreId,
            storeName,
            storeAddress,
            itemTitle,
            winningAmount,
            buyerFee,
            platformFee: buyerFee,
            totalPayAmount,
            currency,
          },
        });
      }

      await createUserNotification({
        userId: slotStatus.userId,
        type: "handover_store_set",
        title: "Handover store confirmed",
        message: `You chose ${addressLine} for auction #${auctionId}. Bring ${itemTitle} there for the winner. You will be credited the winning bid minus the ${sellerFeePercent}% seller fee after admin verifies payment.`,
        metadata: { auctionId, handoverStoreId, storeName, storeAddress, currency },
      });

      await createAdminNotification({
        adminStoreId: handoverStoreId,
        type: "handover_store_set",
        title: "Seller set handover store",
        message: `Auction #${auctionId}: handover at ${addressLine}. Winner notified to collect ${itemTitle}.`,
        metadata: { auctionId, handoverStoreId, winnerUserId: slotStatus.winnerUserId },
      });

      return ok({
        status: true,
        message: "Handover store saved. The winner was notified to collect the item.",
        data: {
          auction_id: auctionId,
          handover_store_id: handoverStoreId,
          handover_store_name: storeName,
          handover_store_address: storeAddress,
        },
      });
    }

    if (action === "mark_item_got") {
      if (!actorUserId) {
        return fail("User id is required.", 422);
      }
      if (Number(slotStatus.winnerUserId) !== actorUserId) {
        return fail("Only the winning buyer can mark the item as received.", 403);
      }
      if (view.auction_status !== "completed") {
        return fail("Item pickup is only available for completed auctions.", 409);
      }
      if (!slotStatus.handoverStoreId) {
        return fail("The seller has not set a handover store yet.", 409);
      }
      if (slotStatus.winnerItemReceivedAt) {
        return fail("You already marked this item as received.", 409);
      }

      slotStatus.winnerItemReceivedAt = new Date();
      await slotStatus.save();

      const itemTitle =
        slot.itemTitle?.trim() || `${slot.bikeMake || ""} ${slot.bikeModel || ""}`.trim() || `Auction #${auctionId}`;
      const handoverStore = await RentalStore.findOne({ legacyId: slotStatus.handoverStoreId });
      const storeName = handoverStore?.storeName || "Auction store";
      const storeAddress = handoverStore?.location?.address || "";

      await createUserNotification({
        userId: slotStatus.userId,
        type: "item_received_by_winner",
        title: "Winner received the item",
        message: `The buyer marked Got for auction #${auctionId} (${itemTitle}) at ${storeName}${storeAddress ? ` (${storeAddress})` : ""}. Settlement can continue.`,
        metadata: { auctionId, itemTitle },
      });

      await createAdminNotification({
        adminStoreId: slotStatus.handoverStoreId || slotStatus.storeId || 1,
        type: "item_received_by_winner",
        title: "Item marked Got by winner",
        message: `Winner confirmed receipt for auction #${auctionId} (${itemTitle}).`,
        metadata: { auctionId, winnerUserId: slotStatus.winnerUserId },
      });

      return ok({
        status: true,
        message: "Status set to Got. The seller and admin were notified.",
        data: { auction_id: auctionId, item_received: true, item_received_at: slotStatus.winnerItemReceivedAt },
      });
    }

    if (action === "settlement") {
      const formType = String(body.form_type || "").trim().toLowerCase();
      const note = String(body.note || "").trim();
      const allowed = ["user_paid", "counterparty_credited", "admin_confirmed"];
      if (!allowed.includes(formType)) {
        return fail("Valid form_type is required.", 422);
      }
      if (view.auction_status !== "completed") {
        return fail("Settlement is only available after auction completion.", 409);
      }

      if (formType === "user_paid") {
        if (!actorUserId) {
          return fail("User id is required.", 422);
        }
        if (Number(slotStatus.winnerUserId) !== actorUserId) {
          return fail("Only the winning buyer can confirm payment.", 403);
        }
      }

      if (formType === "counterparty_credited" || formType === "admin_confirmed") {
        if (actorUserId !== 0) {
          return fail("Only admin can perform this settlement step.", 403);
        }
      }

      if (formType === "counterparty_credited" && !slotStatus.paymentForms?.userPaid?.confirmed) {
        return fail("Winner payment must be confirmed before crediting the seller.", 409);
      }

      if (formType === "admin_confirmed" && !slotStatus.paymentForms?.counterpartyCredited?.confirmed) {
        return fail("Credit the seller wallet before final admin confirmation.", 409);
      }

      const keyMap = {
        user_paid: "userPaid",
        counterparty_credited: "counterpartyCredited",
        admin_confirmed: "adminConfirmed",
      };
      const key = keyMap[formType];
      const wasAlreadyConfirmed = Boolean(slotStatus.paymentForms?.[key]?.confirmed);
      slotStatus.paymentForms = slotStatus.paymentForms || {};
      slotStatus.paymentForms[key] = {
        confirmed: true,
        confirmedAt: new Date(),
        note,
        confirmedByUserId: actorUserId,
      };
      slotStatus.markModified("paymentForms");

      let walletCreditResult = null;

      if (formType === "counterparty_credited" && !wasAlreadyConfirmed) {
        const platform = await getPlatformSettings();
        const winningBid = slotStatus.winningBidId
          ? await AuctionBid.findById(slotStatus.winningBidId)
          : await AuctionBid.findOne({ auctionId, userId: slotStatus.winnerUserId }).sort({ bidAmount: -1 });
        const settlement = resolveSettlementForAuction(slotStatus, winningBid?.bidAmount, platform);
        if (!settlement || !Number.isFinite(settlement.sellerCreditAmount) || settlement.sellerCreditAmount <= 0) {
          return fail("Could not determine seller credit amount.", 422);
        }
        const { sellerCreditAmount, sellerFee, winningAmount, sellerFeePercent } = settlement;

        const sellerUserId = Number(slotStatus.userId);
        const wallet = await Wallet.findOneAndUpdate(
          { userId: sellerUserId },
          {
            $inc: { remainingBalance: sellerCreditAmount },
            $setOnInsert: { legacyId: sellerUserId, userId: sellerUserId },
          },
          { upsert: true, new: true }
        );

        walletCreditResult = {
          sellerUserId,
          creditAmount: sellerCreditAmount,
          sellerFee,
          walletBalance: Number(wallet.remainingBalance || 0),
        };

        slotStatus.paymentForms[key].creditAmount = sellerCreditAmount;
        slotStatus.paymentForms[key].sellerFee = sellerFee;
        slotStatus.paymentForms[key].walletBalanceAfter = walletCreditResult.walletBalance;
        slotStatus.markModified("paymentForms");
      }

      const fullyClosed = isSettlementFullyClosed(slotStatus.paymentForms);
      if (fullyClosed && !slotStatus.fullyClosedAt) {
        slotStatus.fullyClosedAt = new Date();
      }

      await slotStatus.save();

      if (formType === "user_paid" && !wasAlreadyConfirmed) {
        const platform = await getPlatformSettings();
        const store = slotStatus.storeId ? await RentalStore.findOne({ legacyId: slotStatus.storeId }) : null;
        const currency = slotStatus.currency || "PKR";
        const winningBid = slotStatus.winningBidId
          ? await AuctionBid.findById(slotStatus.winningBidId)
          : await AuctionBid.findOne({ auctionId, userId: slotStatus.winnerUserId }).sort({ bidAmount: -1 });
        const settlement = resolveSettlementForAuction(slotStatus, winningBid?.bidAmount, platform);
        if (!settlement) {
          return fail("Could not determine settlement amounts for this auction.", 422);
        }
        const {
          winningAmount,
          buyerFee,
          sellerCreditAmount,
          sellerFee,
          totalPayAmount,
          sellerFeePercent,
          buyerFeePercent,
        } = settlement;
        const itemTitle =
          slot.itemTitle?.trim() || `${slot.bikeMake || ""} ${slot.bikeModel || ""}`.trim() || `Auction #${auctionId}`;
        const pickupStore = store?.storeName || "Auction store";
        const storeAddress = store?.location?.address || slotStatus.city || "";
        const addressLine = storeAddress ? `${pickupStore}, ${storeAddress}` : pickupStore;

        await createUserNotification({
          userId: slotStatus.userId,
          type: "buyer_payment_received",
          title: "Buyer paid — bring your item to the store",
          message: `The winner paid for auction #${auctionId} (${itemTitle}). Select a handover store in My requests and bring the item there. You will be credited ${sellerCreditAmount} ${currency} after admin verifies payment (seller fee ${sellerFee} ${currency} at ${sellerFeePercent}%).`,
          metadata: {
            auctionId,
            storeId: slotStatus.storeId,
            storeName: pickupStore,
            storeAddress,
            itemTitle,
            winningAmount,
            sellerFee,
            sellerCreditAmount,
            sellerFeePercent,
            currency,
          },
        });

        if (slotStatus.winnerUserId) {
          await createUserNotification({
            userId: slotStatus.winnerUserId,
            type: "payment_submitted",
            title: "Payment recorded",
            message: `Your payment of ${totalPayAmount} ${currency} (bid ${winningAmount} + ${buyerFee} ${currency} purchaser fee at ${buyerFeePercent}%) for auction #${auctionId} was recorded. The seller will choose a handover store — you will be notified where to collect ${itemTitle}.`,
            metadata: { auctionId, winningAmount, buyerFee, totalPayAmount, currency },
          });
        }

        await createAdminNotification({
          adminStoreId: slotStatus.storeId || 1,
          type: "buyer_payment_received",
          title: "Winner paid — credit seller wallet",
          message: `Winner reported payment for auction #${auctionId} (${itemTitle}). Verify the bank transfer, then open Auctions → Successful and tap Credit seller to add ${sellerCreditAmount} ${currency} to seller #${slotStatus.userId}'s wallet (winning bid ${winningAmount} minus ${sellerFee} ${currency} seller fee at ${sellerFeePercent}%). Purchaser fee ${buyerFee} ${currency} (${buyerFeePercent}%) was paid by the buyer.`,
          metadata: {
            auctionId,
            winnerUserId: slotStatus.winnerUserId,
            sellerUserId: slotStatus.userId,
            winningAmount,
            buyerFee,
            sellerFee,
            sellerCreditAmount,
            currency,
            action: "credit_seller",
          },
        });
      }

      if (formType === "counterparty_credited" && !wasAlreadyConfirmed && walletCreditResult) {
        const platform = await getPlatformSettings();
        const currency = slotStatus.currency || "PKR";
        const winningBid = slotStatus.winningBidId
          ? await AuctionBid.findById(slotStatus.winningBidId)
          : await AuctionBid.findOne({ auctionId, userId: slotStatus.winnerUserId }).sort({ bidAmount: -1 });
        const settlement = resolveSettlementForAuction(slotStatus, winningBid?.bidAmount, platform);
        const { winningAmount, sellerFee, sellerCreditAmount, buyerFee } = settlement || {};
        const itemTitle =
          slot.itemTitle?.trim() || `${slot.bikeMake || ""} ${slot.bikeModel || ""}`.trim() || `Auction #${auctionId}`;

        await createUserNotification({
          userId: walletCreditResult.sellerUserId,
          type: "seller_wallet_credited",
          title: "Sale credited to your wallet",
          message: `Admin credited ${sellerCreditAmount} ${currency} to your wallet for auction #${auctionId} (${itemTitle}). Winning bid ${winningAmount} ${currency}; seller fee ${sellerFee} ${currency} deducted. New balance: ${walletCreditResult.walletBalance} ${currency}.`,
          metadata: {
            auctionId,
            sellerCreditAmount,
            sellerFee,
            walletBalance: walletCreditResult.walletBalance,
            currency,
          },
        });

        await createAdminNotification({
          adminStoreId: slotStatus.storeId || 1,
          type: "seller_wallet_credited",
          title: "Seller wallet credited",
          message: `Seller #${walletCreditResult.sellerUserId} received ${sellerCreditAmount} ${currency} for auction #${auctionId}. Winning bid ${winningAmount} ${currency}; seller fee ${sellerFee} ${currency} retained; purchaser fee ${buyerFee} ${currency} paid by buyer.`,
          metadata: {
            auctionId,
            sellerUserId: walletCreditResult.sellerUserId,
            sellerCreditAmount,
            walletBalance: walletCreditResult.walletBalance,
            currency,
          },
        });
      }

      if (fullyClosed && slotStatus.fullyClosedAt) {
        const currency = slotStatus.currency || "PKR";
        const winnerId = slotStatus.winnerUserId;
        const ownerId = slotStatus.userId;
        const closedMessage = `Auction #${auctionId} is fully closed. Online payment and settlement were confirmed.`;

        if (winnerId) {
          await createUserNotification({
            userId: winnerId,
            type: "auction_fully_closed",
            title: "Auction fully closed",
            message: closedMessage,
            metadata: { auctionId, fullyClosedAt: slotStatus.fullyClosedAt },
          });
        }
        if (ownerId) {
          await createUserNotification({
            userId: ownerId,
            type: "auction_fully_closed",
            title: "Auction fully closed",
            message: closedMessage,
            metadata: { auctionId, fullyClosedAt: slotStatus.fullyClosedAt },
          });
        }
        await createAdminNotification({
          adminStoreId: slotStatus.storeId || 1,
          type: "auction_fully_closed",
          title: "Paid & fully closed",
          message: closedMessage,
          metadata: { auctionId, winnerUserId: winnerId, fullyClosedAt: slotStatus.fullyClosedAt, currency },
        });
      }

      const settlementMessages = {
        user_paid: "Winner payment recorded. Admin will verify and credit the seller.",
        counterparty_credited: walletCreditResult
          ? `Seller wallet credited with ${walletCreditResult.creditAmount}. New balance: ${walletCreditResult.walletBalance}.`
          : "Seller credit recorded.",
        admin_confirmed: fullyClosed ? "Settlement complete. Auction is fully closed." : "Admin confirmation saved.",
      };

      return ok({
        status: true,
        message: settlementMessages[formType] || (fullyClosed ? "Settlement complete. Auction is fully closed." : "Settlement form saved."),
        data: {
          auction_id: auctionId,
          form_type: formType,
          payment_forms: slotStatus.paymentForms,
          is_fully_closed: fullyClosed,
          fully_closed_at: slotStatus.fullyClosedAt || null,
          wallet_credit: walletCreditResult,
        },
      });
    }

    if (action === "purge" || action === "delete") {
      const confirm = String(body.confirm || "").trim().toUpperCase();
      if (confirm !== "DELETE") {
        return fail('Type DELETE in the confirm field to permanently remove this auction.', 422);
      }

      const result = await purgeAuctionById(auctionId);

      await createAdminNotification({
        adminStoreId: slotStatus?.storeId || 1,
        type: "auction_purged",
        title: "Auction data cleared",
        message: `Auction #${auctionId} and related records were permanently deleted from the database.`,
        metadata: { auctionId, deleted: result.deleted },
      });

      return ok({
        status: true,
        message: `Auction #${auctionId} and all related data were permanently deleted.`,
        data: result,
      });
    }

    return fail("Unknown action.", 422);
  } catch (error) {
    return fail("Failed to update auction", 500, error.message);
  }
}

export async function PUT(request) {
  try {
    await connectToDatabase();
    const form = await request.formData();
    const userId = Number(form.get("user_id"));
    const highestPrice = Number(form.get("highest_price"));
    const lowestPrice = Number(form.get("lowest_price"));
    const policyAccepted = String(form.get("policy_accepted") || "") === "true";
    const registeredOnCnic = String(form.get("registered_on_cnic") || "") === "true";
    const cnicNumber = String(form.get("cnic_number") || "").trim();
    const storeId = Number(form.get("store_id"));
    const city = String(form.get("city") || "").trim();
    const currency = String(form.get("currency") || "PKR").trim().toUpperCase();
    const categoryId = Number(form.get("category_id"));
    const itemTitle = String(form.get("item_title") || "").trim();
    const bikeMake = String(form.get("bike_make") || "").trim();
    const bikeModel = String(form.get("bike_model") || "").trim();

    const bikeFiles = [form.get("image_1"), form.get("image_2"), form.get("image_3"), form.get("image_4")].filter(Boolean);
    const cnicFile = form.get("cnic_image");

    if (!userId || !Number.isFinite(highestPrice) || !Number.isFinite(lowestPrice)) {
      return fail("User, highest price, and lowest price are required.", 422);
    }
    if (!policyAccepted) {
      return fail("You must accept the auction policy before submitting.", 422);
    }
    if (!registeredOnCnic) {
      return fail("Confirm that the bike is registered on your CNIC.", 422);
    }
    if (!cnicNumber || cnicNumber.length < 5) {
      return fail("Valid CNIC number is required.", 422);
    }
    if (!storeId || !city) {
      return fail("Select an auction store and city.", 422);
    }
    if (!bikeMake || !bikeModel) {
      return fail("Make and model are required.", 422);
    }
    if (!ALLOWED_CURRENCIES.includes(currency)) {
      return fail("Currency must be PKR, USD, or CAD.", 422);
    }
    if (!categoryId) {
      return fail("Select an auction category.", 422);
    }
    const category = await AuctionCategory.findOne({ legacyId: categoryId, active: true });
    if (!category) {
      return fail("Selected category is not available.", 404);
    }
    if (bikeFiles.length < 4) {
      return fail("At least 4 bike images are required.", 422);
    }
    if (!isUploadBlob(cnicFile)) {
      return fail("CNIC image upload is required.", 422);
    }
    if (highestPrice < lowestPrice) {
      return fail("Highest price must be greater than or equal to lowest price.", 422);
    }

    const store = await RentalStore.findOne({ legacyId: storeId });
    if (!store) {
      return fail("Selected store was not found.", 404);
    }

    const uploadedBikePaths = [];
    for (const file of bikeFiles) {
      uploadedBikePaths.push(await uploadFile(file, "auctions"));
    }
    const cnicImagePath = cnicFile ? await uploadFile(cnicFile, "cnic") : null;
    if (!cnicImagePath) {
      return fail("CNIC image upload is required.", 422);
    }

    const latestSlot = await AuctionSlot.findOne().sort({ legacyId: -1 }).select("legacyId");
    const nextSlotLegacyId = (latestSlot?.legacyId || 0) + 1;

    await AuctionSlot.create({
      legacyId: nextSlotLegacyId,
      image1: uploadedBikePaths[0],
      image2: uploadedBikePaths[1],
      image3: uploadedBikePaths[2],
      image4: uploadedBikePaths[3],
      highestPrize: highestPrice,
      lowestPrize: lowestPrice,
      categoryId: category.legacyId,
      categoryName: category.name,
      itemTitle: itemTitle || `${bikeMake} ${bikeModel}`.trim(),
      bikeMake,
      bikeModel,
      bikeYear: String(form.get("bike_year") || "").trim(),
      bikeEngineCc: String(form.get("bike_engine_cc") || "").trim(),
      bikeColor: String(form.get("bike_color") || "").trim(),
      bikeMileage: String(form.get("bike_mileage") || "").trim(),
      bikeNotes: String(form.get("bike_notes") || "").trim(),
    });

    await AuctionSlotStatus.create({
      auctionId: nextSlotLegacyId,
      userId,
      auctionStatus: "pending_review",
      cnicNumber,
      cnicImagePath,
      registeredOnCnic: true,
      policyAcceptedAt: new Date(),
      storeId,
      city,
      currency,
      submittedAt: new Date(),
    });

    await createUserNotification({
      userId,
      type: "auction_requested",
      title: "Request in queue",
      message: `Auction request #${nextSlotLegacyId} is in queue. Admin review may take up to 48 hours.`,
      metadata: { auctionId: nextSlotLegacyId },
    });
    await createAdminNotification({
      adminStoreId: storeId,
      type: "auction_pending",
      title: "New auction request",
      message: `Auction request #${nextSlotLegacyId} needs inspection.`,
      metadata: { auctionId: nextSlotLegacyId, userId },
    });

    return ok({
      status: true,
      message: "Auction request submitted. It is in queue for admin review (up to 48 hours).",
      data: {
        id: nextSlotLegacyId,
        user_id: userId,
        auction_status: "pending_review",
      },
    });
  } catch (error) {
    return createAuctionFail(error);
  }
}
