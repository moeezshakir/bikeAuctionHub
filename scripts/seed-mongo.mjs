import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  demoAuctionSlots,
  demoCategories,
  demoIssues,
  demoStores,
  demoUser,
  demoUser2,
  demoUser3,
  demoUser4,
  demoWallet,
} from "../src/lib/mockData.js";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "ride_rental_hub";
const CLEAR_RIDE_DATA = process.env.SEED_CLEAR_RIDE_DATA !== "false";

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI. Set it in .env.local or pass --env-file=.env.local");
}

const START_WINDOW_MS = 6 * 60 * 60 * 1000;

const adminSchema = new mongoose.Schema(
  { legacyId: Number, storeId: Number, name: String, email: String, password: String },
  { collection: "admin" }
);
const registeredUserSchema = new mongoose.Schema(
  { legacyId: Number, username: String, email: String, password: String },
  { collection: "rrh_registered_user" }
);
const userProfileSchema = new mongoose.Schema(
  {
    legacyId: Number,
    name: String,
    email: String,
    phoneNumber: String,
    address: String,
    nationality: String,
    country: String,
    languages: String,
    cnicNo: String,
    accountVerifiedStatus: Boolean,
    profilePic: String,
    profilePicPath: String,
  },
  { collection: "rrh_user" }
);
const socialLinksSchema = new mongoose.Schema(
  { userId: Number, facebook: String, instagram: String, linkedin: String, youtube: String },
  { collection: "social_links" }
);
const walletSchema = new mongoose.Schema(
  { legacyId: Number, userId: Number, remainingBalance: Number },
  { collection: "wallet" }
);
const storeSchema = new mongoose.Schema(
  {
    legacyId: Number,
    location: Object,
    image: String,
    bikeleft: Number,
    typesOfBike: [String],
    status: String,
    storeName: String,
  },
  { collection: "rental_stores" }
);
const issueSchema = new mongoose.Schema(
  { legacyId: Number, userId: Number, title: String, description: String, submitTime: Date, status: String },
  { collection: "report_issues" }
);
const auctionSlotSchema = new mongoose.Schema(
  {
    legacyId: Number,
    image1: String,
    image2: String,
    image3: String,
    image4: String,
    highestPrize: Number,
    lowestPrize: Number,
    bikeMake: String,
    bikeModel: String,
    bikeYear: String,
    bikeEngineCc: String,
    bikeColor: String,
    bikeMileage: String,
    bikeNotes: String,
  },
  { collection: "auction_slots" }
);
const auctionStatusSchema = new mongoose.Schema(
  {
    auctionId: Number,
    userId: Number,
    auctionStatus: String,
    cnicNumber: String,
    cnicImagePath: String,
    registeredOnCnic: Boolean,
    policyAcceptedAt: Date,
    storeId: Number,
    city: String,
    submittedAt: Date,
    approvedAt: Date,
    startDeadlineAt: Date,
    startedAt: Date,
    endDeadlineAt: Date,
    completedAt: Date,
    winnerUserId: Number,
    settlementSnapshot: Object,
    paymentForms: Object,
  },
  { collection: "auction_slots_status" }
);
const auctionBidSchema = new mongoose.Schema(
  {
    auctionId: Number,
    userId: Number,
    bidderName: String,
    bidAmount: Number,
    createdAt: Date,
  },
  { collection: "auction_slots_comment" }
);
const categorySchema = new mongoose.Schema(
  { legacyId: Number, name: String, active: Boolean },
  { collection: "auction_categories" }
);
const platformSettingsSchema = new mongoose.Schema(
  {
    key: String,
    platformFeePercent: Number,
    buyerFeePercent: Number,
    bidDepositAmount: Number,
    paymentBankName: String,
    paymentAccountTitle: String,
    paymentAccountNumber: String,
    paymentIban: String,
    paymentInstructions: String,
  },
  { collection: "platform_settings" }
);

const Admin = mongoose.models.AdminSeed || mongoose.model("AdminSeed", adminSchema);
const RegisteredUser = mongoose.models.RegisteredUserSeed || mongoose.model("RegisteredUserSeed", registeredUserSchema);
const UserProfile = mongoose.models.UserProfileSeed || mongoose.model("UserProfileSeed", userProfileSchema);
const SocialLinks = mongoose.models.SocialLinksSeed || mongoose.model("SocialLinksSeed", socialLinksSchema);
const Wallet = mongoose.models.WalletSeed || mongoose.model("WalletSeed", walletSchema);
const RentalStore = mongoose.models.RentalStoreSeed || mongoose.model("RentalStoreSeed", storeSchema);
const ReportIssue = mongoose.models.ReportIssueSeed || mongoose.model("ReportIssueSeed", issueSchema);
const AuctionSlot = mongoose.models.AuctionSlotSeed || mongoose.model("AuctionSlotSeed", auctionSlotSchema);
const AuctionSlotStatus = mongoose.models.AuctionSlotStatusSeed || mongoose.model("AuctionSlotStatusSeed", auctionStatusSchema);
const AuctionBid = mongoose.models.AuctionBidSeed || mongoose.model("AuctionBidSeed", auctionBidSchema);
const AuctionCategory = mongoose.models.AuctionCategorySeed || mongoose.model("AuctionCategorySeed", categorySchema);
const PlatformSettings = mongoose.models.PlatformSettingsSeed || mongoose.model("PlatformSettingsSeed", platformSettingsSchema);

const LEGACY_RIDE_COLLECTIONS = ["bikerentals", "booked_bikes", "bikes_data", "ride_places"];
const REMOVED_DEMO_EMAILS = ["aliofficial0048@gmail.com"];

async function removeRetiredDemoAccounts(db) {
  for (const email of REMOVED_DEMO_EMAILS) {
    const reg = await db.collection("rrh_registered_user").findOne({ email });
    if (!reg) continue;
    const userId = reg.legacyId;
    await Promise.all([
      db.collection("rrh_registered_user").deleteMany({ email }),
      db.collection("rrh_user").deleteMany({ legacyId: userId }),
      db.collection("social_links").deleteMany({ userId }),
      db.collection("wallet").deleteMany({ userId }),
      db.collection("otp_verification").deleteMany({ userId }),
      db.collection("rrh_user_requiredinfo").deleteMany({ userId }),
    ]);
    console.log(`Removed retired demo account: ${email} (user id ${userId}).`);
  }
}

async function seedUser(user, hashedPassword) {
  await RegisteredUser.updateOne(
    { email: user.email },
    { legacyId: user.user_id, username: user.name, email: user.email, password: hashedPassword },
    { upsert: true }
  );

  await UserProfile.updateOne(
    { legacyId: user.user_id },
    {
      legacyId: user.user_id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      nationality: user.nationality,
      languages: user.languages,
      accountVerifiedStatus: true,
      profilePic: user.image,
      profilePicPath: user.image,
    },
    { upsert: true }
  );

  await SocialLinks.updateOne(
    { userId: user.user_id },
    { userId: user.user_id, ...user.socialLinks },
    { upsert: true }
  );
}

async function run() {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  const db = mongoose.connection.db;

  console.log(`Seeding database: ${DB_NAME}`);

  if (CLEAR_RIDE_DATA) {
    for (const name of LEGACY_RIDE_COLLECTIONS) {
      const result = await db.collection(name).deleteMany({});
      console.log(`Cleared legacy collection "${name}" (${result.deletedCount} docs).`);
    }
  }

  await removeRetiredDemoAccounts(db);

  const hashedAdminPassword = await bcrypt.hash("12345678", 10);
  const hashedUserPassword = await bcrypt.hash("12345678", 10);

  await Admin.updateOne(
    { email: "admin@example.com" },
    { legacyId: 1, storeId: 1, name: "Admin", email: "admin@example.com", password: hashedAdminPassword },
    { upsert: true }
  );

  await seedUser(demoUser, hashedUserPassword);
  await seedUser(demoUser2, hashedUserPassword);
  await seedUser(demoUser3, hashedUserPassword);
  await seedUser(demoUser4, hashedUserPassword);

  await Wallet.updateOne(
    { userId: demoWallet.user_id },
    { legacyId: 1, userId: demoWallet.user_id, remainingBalance: demoWallet.remainingBalance },
    { upsert: true }
  );

  await Wallet.updateOne(
    { userId: demoUser2.user_id },
    { legacyId: 2, userId: demoUser2.user_id, remainingBalance: 5000 },
    { upsert: true }
  );

  await Wallet.updateOne(
    { userId: demoUser3.user_id },
    { legacyId: 3, userId: demoUser3.user_id, remainingBalance: 8000 },
    { upsert: true }
  );

  await Wallet.updateOne(
    { userId: demoUser4.user_id },
    { legacyId: 4, userId: demoUser4.user_id, remainingBalance: 7500 },
    { upsert: true }
  );

  await PlatformSettings.updateOne(
    { key: "global" },
    {
      key: "global",
      platformFeePercent: 5,
      buyerFeePercent: 0.3,
      bidDepositAmount: 500,
      paymentBankName: "HBL",
      paymentAccountTitle: "Bike Auction Platform",
      paymentAccountNumber: "1234567890123",
      paymentIban: "PK36HABB0023456789012345",
      paymentInstructions:
        "Transfer the full winning bid amount to this account. Use your auction number (e.g. Auction #4) as the payment reference. After paying, open the Won tab and tap “I paid online”. Cash is not accepted.",
    },
    { upsert: true }
  );

  for (const category of demoCategories) {
    await AuctionCategory.updateOne(
      { legacyId: category.id },
      { legacyId: category.id, name: category.name, active: true },
      { upsert: true }
    );
  }

  for (const store of demoStores) {
    await RentalStore.updateOne(
      { legacyId: store._id },
      {
        legacyId: store._id,
        location: store.location,
        image: store.image,
        bikeleft: store.bikeleft,
        typesOfBike: store.types_of_bike,
        status: store.status,
        storeName: store.storeName,
      },
      { upsert: true }
    );
  }

  for (const issue of demoIssues) {
    await ReportIssue.updateOne(
      { legacyId: issue.user_id, title: issue.title },
      {
        legacyId: issue.user_id,
        userId: issue.user_id,
        title: issue.title,
        description: issue.description,
        status: "open",
        submitTime: new Date(issue.submit_time),
      },
      { upsert: true }
    );
  }

  await AuctionBid.deleteMany({});
  await AuctionSlotStatus.deleteMany({});
  await AuctionSlot.deleteMany({});

  const now = new Date();

  for (const slot of demoAuctionSlots) {
    const status = slot.auction_status;
    const submittedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    await AuctionSlot.create({
      legacyId: slot.id,
      image1: slot.image_1,
      image2: slot.image_2,
      image3: slot.image_3,
      image4: slot.image_4,
      highestPrize: slot.highest_prize,
      lowestPrize: slot.lowest_prize,
      categoryId: slot.category_id || 1,
      categoryName: slot.category_name || "Motorcycle",
      itemTitle: slot.item_title || `${slot.bike_make} ${slot.bike_model}`.trim(),
      bikeMake: slot.bike_make,
      bikeModel: slot.bike_model,
      bikeYear: slot.bike_year,
      bikeEngineCc: slot.bike_engine_cc,
      bikeColor: slot.bike_color,
      bikeMileage: slot.bike_mileage,
      bikeNotes: slot.bike_notes,
    });

    const statusDoc = {
      auctionId: slot.id,
      userId: slot.user_id,
      auctionStatus: status,
      cnicNumber: slot.cnic_number,
      cnicImagePath: slot.cnic_image,
      registeredOnCnic: true,
      policyAcceptedAt: submittedAt,
      storeId: slot.store_id,
      city: slot.city,
      currency: slot.currency || "PKR",
      submittedAt,
    };

    if (status === "approved") {
      statusDoc.approvedAt = now;
      statusDoc.startDeadlineAt = new Date(now.getTime() + START_WINDOW_MS);
    }

    if (status === "live") {
      statusDoc.approvedAt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      statusDoc.startDeadlineAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      statusDoc.startedAt = new Date(now.getTime() - 30 * 60 * 1000);
      statusDoc.endDeadlineAt = new Date(statusDoc.startedAt.getTime() + 3 * 60 * 60 * 1000);
    }

    if (status === "completed") {
      statusDoc.approvedAt = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      statusDoc.startedAt = new Date(now.getTime() - 40 * 60 * 60 * 1000);
      statusDoc.completedAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      statusDoc.winnerUserId = slot.winner_user_id;
      statusDoc.paymentForms = slot.payment_forms || {};
      if (slot.winning_bid_amount) {
        const sellerPct = 5;
        const buyerPct = 0.3;
        const winningAmount = Number(slot.winning_bid_amount);
        const sellerFee = Math.round((winningAmount * sellerPct) / 100);
        const buyerFee = Math.round((winningAmount * buyerPct) / 100);
        statusDoc.settlementSnapshot = {
          sellerFeePercent: sellerPct,
          buyerFeePercent: buyerPct,
          winningAmount,
          sellerFee,
          buyerFee,
          totalPayAmount: winningAmount + buyerFee,
          sellerCreditAmount: winningAmount - sellerFee,
          lockedAt: statusDoc.completedAt,
        };
      }
    }

    await AuctionSlotStatus.create(statusDoc);

    if (slot.demo_bids?.length) {
      for (const bid of slot.demo_bids) {
        await AuctionBid.create({
          auctionId: slot.id,
          userId: bid.user_id,
          bidderName: bid.bidder_name,
          bidAmount: bid.bid_amount,
          createdAt: now,
        });
      }
    }

    if (status === "completed" && slot.winner_user_id && slot.winning_bid_amount) {
      const winningBid = await AuctionBid.findOne({
        auctionId: slot.id,
        userId: slot.winner_user_id,
        bidAmount: slot.winning_bid_amount,
      });
      if (!winningBid) {
        const created = await AuctionBid.create({
          auctionId: slot.id,
          userId: slot.winner_user_id,
          bidderName: demoUser.name,
          bidAmount: slot.winning_bid_amount,
          createdAt: statusDoc.completedAt,
        });
        await AuctionSlotStatus.updateOne(
          { auctionId: slot.id },
          { $set: { winningBidId: created._id } }
        );
      }
    }
  }

  await mongoose.disconnect();

  console.log("Auction-only Mongo seed completed.");
  console.log("");
  console.log("Demo logins (password: 12345678):");
  console.log("  Admin: admin@example.com");
  console.log(`  User 1: ${demoUser.email} (id ${demoUser.user_id}) — seller, pending + approved auctions`);
  console.log(`  User 2: ${demoUser2.email} (id ${demoUser2.user_id}) — live auction owner`);
  console.log(`  User 3: ${demoUser3.email} (id ${demoUser3.user_id}) — bidder`);
  console.log(`  User 4: ${demoUser4.email} (id ${demoUser4.user_id}) — bidder`);
  console.log("");
  console.log("Auction demo rows:");
  console.log("  #1 pending_review (admin queue)");
  console.log("  #2 approved — start within 6h");
  console.log("  #3 live — multiple demo bids visible in feed");
  console.log("  #4 completed — admin success tab");
  console.log("");
  console.log("Admin: /admin/stores — set platform fee (1–8%) and manage categories");
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
