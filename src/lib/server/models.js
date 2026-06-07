import mongoose from "mongoose";

const { Schema, models, model } = mongoose;

const adminSchema = new Schema(
  {
    legacyId: { type: Number, index: true },
    storeId: { type: Number, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { collection: "admin" }
);

const registeredUserSchema = new Schema(
  {
    legacyId: { type: Number, index: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { collection: "rrh_registered_user" }
);

const userProfileSchema = new Schema(
  {
    legacyId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: String,
    address: String,
    nationality: String,
    country: String,
    languages: String,
    cnicNo: String,
    accountVerifiedStatus: { type: Boolean, default: false },
    profilePic: String,
    profilePicPath: String,
  },
  { collection: "rrh_user" }
);

const userRequiredInfoSchema = new Schema(
  {
    userId: { type: Number, required: true, unique: true },
    cnic: String,
    recoveryEmail: String,
    recoveryPhoneNumber: String,
  },
  { collection: "rrh_user_requiredinfo" }
);

const socialLinksSchema = new Schema(
  {
    userId: { type: Number, required: true, unique: true },
    facebook: String,
    instagram: String,
    linkedin: String,
    youtube: String,
  },
  { collection: "social_links" }
);

const awardSchema = new Schema(
  {
    legacyId: { type: Number, index: true },
    title: { type: String, required: true },
    description: String,
    image: String,
  },
  { collection: "awards" }
);

const userAwardSchema = new Schema(
  {
    userId: { type: Number, required: true },
    awardId: { type: Number, required: true },
  },
  { collection: "user_awards" }
);

const otpVerificationSchema = new Schema(
  {
    userId: { type: Number, required: true, unique: true },
    otp: { type: String, required: true },
    expirationTime: { type: Date, required: true },
  },
  { collection: "otp_verification" }
);

const rentalStoreSchema = new Schema(
  {
    legacyId: { type: Number, required: true, unique: true },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      city: String,
    },
    image: String,
    bikeleft: Number,
    typesOfBike: [String],
    status: String,
    storeName: String,
  },
  { collection: "rental_stores" }
);

const bikeSchema = new Schema(
  {
    legacyId: { type: Number, required: true, unique: true },
    storeId: Number,
    type: String,
    imageUrl: String,
    pricePerHour: Number,
    bikeBookingStatus: String,
  },
  { collection: "bikes_data" }
);

const bookedBikeSchema = new Schema(
  {
    legacyId: { type: Number, index: true },
    userId: Number,
    bikeId: Number,
    location: String,
    startTime: Date,
    endTime: Date,
    status: { type: String, enum: ["booked", "Complete"], default: "booked" },
  },
  { collection: "booked_bikes" }
);

const bikeRentalSchema = new Schema(
  {
    userId: Number,
    storeId: Number,
    bikeId: Number,
    bikeType: String,
    startTime: Date,
    endTime: Date,
    location: String,
    status: { type: String, enum: ["booked", "Complete"], default: "booked" },
  },
  { collection: "bikerentals" }
);

const walletSchema = new Schema(
  {
    legacyId: { type: Number, index: true },
    userId: { type: Number, required: true, unique: true },
    remainingBalance: { type: Number, default: 0 },
  },
  { collection: "wallet" }
);

const reportIssueSchema = new Schema(
  {
    legacyId: { type: Number, index: true },
    userId: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: "open" },
    resolutionNote: { type: String, default: "" },
    submitTime: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
  },
  { collection: "report_issues" }
);

const auctionSlotSchema = new Schema(
  {
    legacyId: { type: Number, required: true, unique: true },
    image1: String,
    image2: String,
    image3: String,
    image4: String,
    highestPrize: Number,
    lowestPrize: Number,
    categoryId: Number,
    categoryName: String,
    itemTitle: String,
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

const paymentFormEntrySchema = new Schema(
  {
    confirmed: { type: Boolean, default: false },
    confirmedAt: Date,
    note: String,
    confirmedByUserId: Number,
  },
  { _id: false }
);

const auctionSlotStatusSchema = new Schema(
  {
    auctionId: { type: Number, required: true, unique: true },
    userId: { type: Number, required: true },
    auctionStatus: {
      type: String,
      default: "pending_review",
    },
    cnicNumber: String,
    cnicImagePath: String,
    registeredOnCnic: { type: Boolean, default: false },
    policyAcceptedAt: Date,
    storeId: Number,
    city: String,
    submittedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    startDeadlineAt: Date,
    startedAt: Date,
    endDeadlineAt: Date,
    completedAt: Date,
    winningBidId: { type: Schema.Types.ObjectId, default: null },
    winnerUserId: Number,
    currency: { type: String, default: "PKR" },
    stoppedAt: Date,
    stopReason: String,
    fullyClosedAt: Date,
    handoverStoreId: Number,
    handoverSetAt: Date,
    winnerItemReceivedAt: Date,
    settlementSnapshot: {
      sellerFeePercent: Number,
      buyerFeePercent: Number,
      winningAmount: Number,
      sellerFee: Number,
      buyerFee: Number,
      totalPayAmount: Number,
      sellerCreditAmount: Number,
      lockedAt: Date,
    },
    paymentForms: {
      userPaid: { type: paymentFormEntrySchema, default: () => ({}) },
      counterpartyCredited: { type: paymentFormEntrySchema, default: () => ({}) },
      adminConfirmed: { type: paymentFormEntrySchema, default: () => ({}) },
    },
  },
  { collection: "auction_slots_status" }
);

const auctionBidSchema = new Schema(
  {
    auctionId: { type: Number, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    bidderName: { type: String, default: "Participant" },
    bidAmount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "auction_slots_comment" }
);

const notificationEventSchema = new Schema(
  {
    userId: { type: Number, index: true, default: null },
    adminStoreId: { type: Number, index: true, default: null },
    role: { type: String, enum: ["user", "admin"], required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { collection: "notification_events", timestamps: true }
);

const ridePlaceSchema = new Schema(
  {
    storeId: { type: Number, required: true, unique: true },
    locations: [String],
  },
  { collection: "ride_places" }
);

const platformSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    platformFeePercent: { type: Number, default: 5, min: 1, max: 5 },
    buyerFeePercent: { type: Number, default: 0.3, min: 0.1, max: 1.9 },
    bidDepositAmount: { type: Number, default: 500 },
    paymentBankName: { type: String, default: "" },
    paymentAccountTitle: { type: String, default: "" },
    paymentAccountNumber: { type: String, default: "" },
    paymentIban: { type: String, default: "" },
    paymentInstructions: { type: String, default: "" },
    paymentBankAccounts: { type: Schema.Types.Mixed, default: null },
    auctionRequestFields: { type: Schema.Types.Mixed, default: null },
  },
  { collection: "platform_settings" }
);

const auctionCategorySchema = new Schema(
  {
    legacyId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { collection: "auction_categories" }
);

const auctionBidDepositSchema = new Schema(
  {
    auctionId: { type: Number, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    depositAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    paidAt: { type: Date, default: Date.now },
  },
  { collection: "auction_bid_deposits" }
);

export const Admin = models.Admin || model("Admin", adminSchema);
export const RegisteredUser = models.RegisteredUser || model("RegisteredUser", registeredUserSchema);
export const UserProfile = models.UserProfile || model("UserProfile", userProfileSchema);
export const UserRequiredInfo = models.UserRequiredInfo || model("UserRequiredInfo", userRequiredInfoSchema);
export const SocialLinks = models.SocialLinks || model("SocialLinks", socialLinksSchema);
export const Award = models.Award || model("Award", awardSchema);
export const UserAward = models.UserAward || model("UserAward", userAwardSchema);
export const OtpVerification = models.OtpVerification || model("OtpVerification", otpVerificationSchema);
export const RentalStore = models.RentalStore || model("RentalStore", rentalStoreSchema);
export const Bike = models.Bike || model("Bike", bikeSchema);
export const BookedBike = models.BookedBike || model("BookedBike", bookedBikeSchema);
export const BikeRental = models.BikeRental || model("BikeRental", bikeRentalSchema);
export const Wallet = models.Wallet || model("Wallet", walletSchema);
export const ReportIssue = models.ReportIssue || model("ReportIssue", reportIssueSchema);
export const AuctionSlot = models.AuctionSlot || model("AuctionSlot", auctionSlotSchema);
export const AuctionSlotStatus = models.AuctionSlotStatus || model("AuctionSlotStatus", auctionSlotStatusSchema);
export const AuctionBid = models.AuctionBid || model("AuctionBid", auctionBidSchema);
export const NotificationEvent = models.NotificationEvent || model("NotificationEvent", notificationEventSchema);
export const RidePlace = models.RidePlace || model("RidePlace", ridePlaceSchema);
export const PlatformSettings = models.PlatformSettings || model("PlatformSettings", platformSettingsSchema);
export const AuctionCategory = models.AuctionCategory || model("AuctionCategory", auctionCategorySchema);
export const AuctionBidDeposit = models.AuctionBidDeposit || model("AuctionBidDeposit", auctionBidDepositSchema);
