export const demoUser = {
  user_id: 47,
  name: "Ahmed Khan",
  email: "demo.user@bikeauction.com",
  phoneNumber: "0300 5551234",
  address: "Model Town, Lahore",
  nationality: "Pakistani",
  languages: "English, Urdu",
  image: "",
  socialLinks: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    youtube: "https://youtube.com",
  },
  awards: [
    {
      title: "Trusted Rider",
      description: "Verified rider with consistent on-time returns.",
      image: "",
    },
  ],
};

export const demoStores = [
  {
    _id: 1,
    storeName: "Lahore Fort Station",
    bikeleft: 6,
    status: "Open",
    image: "",
    location: {
      latitude: 31.5502,
      longitude: 74.3436,
      address: "Fort Road",
      city: "Lahore",
    },
    types_of_bike: ["Road Bike", "Mountain Bike", "Electric Bike"],
  },
  {
    _id: 3,
    storeName: "Canal View Hub",
    bikeleft: 4,
    status: "Open",
    image: "",
    location: {
      latitude: 31.552,
      longitude: 74.345,
      address: "Canal Road",
      city: "Lahore",
    },
    types_of_bike: ["Cruiser Bike", "Road Bike"],
  },
];

export const demoStoreBikes = [
  {
    id: 1,
    store_id: 1,
    type: "Road Bike",
    imageUrl: "storeBikesImages/b_img-ft -1.jpg",
    pricePerHour: 150,
    bikeBookingStatus: "available",
  },
  {
    id: 6,
    store_id: 1,
    type: "Electric Bike",
    imageUrl: "storeBikesImages/b_img-ft -5.jpg",
    pricePerHour: 220,
    bikeBookingStatus: "booked",
    booking: {
      userId: 47,
      bikeId: 6,
      location: "Wagah Border",
      startTime: "2026-04-24 09:00:00",
      endTime: "2026-04-24 13:00:00",
      bookingStatus: "booked",
    },
  },
  {
    id: 15,
    store_id: 3,
    type: "City Bike",
    imageUrl: "b_img-ft -1.jpg",
    pricePerHour: 110,
    bikeBookingStatus: "available",
  },
];

export const demoWallet = {
  user_id: 47,
  remainingBalance: 3350,
};

export const demoRideHistory = [
  {
    user_id: 47,
    store_id: 1,
    bike_id: 6,
    bike_type: "Electric Bike",
    start_time: "2026-04-21 09:00:00",
    end_time: "2026-04-21 11:30:00",
    location: "Wagah Border",
    status: "Complete",
  },
  {
    user_id: 47,
    store_id: 3,
    bike_id: 15,
    bike_type: "City Bike",
    start_time: "2026-04-20 16:00:00",
    end_time: "2026-04-20 17:15:00",
    location: "Canal Road",
    status: "Complete",
  },
];

/** Second user — can bid on live auctions. */
export const demoUser2 = {
  user_id: 28,
  name: "Sara Khan",
  email: "sara.demo@example.com",
  phoneNumber: "0300 1112233",
  address: "Gulberg, Lahore",
  nationality: "Pakistani",
  languages: "English, Urdu",
  image: "",
  socialLinks: {
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  },
};

/** Third demo bidder. */
export const demoUser3 = {
  user_id: 29,
  name: "John Malik",
  email: "john.demo@example.com",
  phoneNumber: "0300 2223344",
  address: "DHA Phase 5, Lahore",
  nationality: "Pakistani",
  languages: "English, Urdu",
  image: "",
  socialLinks: { facebook: "", instagram: "", linkedin: "", youtube: "" },
};

/** Fourth demo bidder. */
export const demoUser4 = {
  user_id: 30,
  name: "Fatima Ali",
  email: "fatima.demo@example.com",
  phoneNumber: "0300 3334455",
  address: "Johar Town, Lahore",
  nationality: "Pakistani",
  languages: "English, Urdu",
  image: "",
  socialLinks: { facebook: "", instagram: "", linkedin: "", youtube: "" },
};

export const demoCategories = [
  { id: 1, name: "Motorcycle" },
  { id: 2, name: "Scooter" },
  { id: 3, name: "Electric Bike" },
  { id: 4, name: "Bicycle" },
  { id: 5, name: "Spare Parts" },
  { id: 6, name: "Riding Gear" },
];

/**
 * Auction-only demo rows. Status values match app API:
 * pending_review | approved | live | completed
 */
export const demoAuctionSlots = [
  {
    id: 1,
    user_id: 47,
    auction_status: "pending_review",
    store_id: 1,
    city: "Lahore",
    currency: "PKR",
    category_id: 1,
    category_name: "Motorcycle",
    item_title: "Honda CD 70 2021",
    image_1: "auctionslots_bikes_image/motorbike.png",
    image_2: "auctionslots_bikes_image/icon-4399701_1280.webp",
    image_3: "auctionslots_bikes_image/motorbike.png",
    image_4: "auctionslots_bikes_image/icon-4399701_1280.webp",
    highest_prize: 180000,
    lowest_prize: 150000,
    bike_make: "Honda",
    bike_model: "CD 70",
    bike_year: "2021",
    bike_engine_cc: "70",
    bike_color: "Red",
    bike_mileage: "12000",
    bike_notes: "Single owner, good condition.",
    cnic_number: "35201-1234567-1",
    cnic_image: "uploads/cnic/demo-cnic.jpg",
  },
  {
    id: 2,
    user_id: 47,
    auction_status: "approved",
    store_id: 1,
    city: "Lahore",
    currency: "PKR",
    category_id: 1,
    category_name: "Motorcycle",
    item_title: "Yamaha YBR 125 2022",
    image_1: "auctionslots_bikes_image/icon-4399701_1280.webp",
    image_2: "auctionslots_bikes_image/motorbike.png",
    image_3: "auctionslots_bikes_image/icon-4399701_1280.webp",
    image_4: "auctionslots_bikes_image/motorbike.png",
    highest_prize: 250000,
    lowest_prize: 200000,
    bike_make: "Yamaha",
    bike_model: "YBR 125",
    bike_year: "2022",
    bike_engine_cc: "125",
    bike_color: "Black",
    bike_mileage: "8000",
    bike_notes: "Approved — start within 6 hours in the app.",
    cnic_number: "35201-7654321-9",
    cnic_image: "uploads/cnic/demo-cnic.jpg",
  },
  {
    id: 3,
    user_id: 28,
    auction_status: "live",
    store_id: 3,
    city: "Lahore",
    currency: "PKR",
    category_id: 1,
    category_name: "Motorcycle",
    item_title: "Suzuki GS 150 2020",
    image_1: "auctionslots_bikes_image/motorbike.png",
    image_2: "auctionslots_bikes_image/motorbike.png",
    image_3: "auctionslots_bikes_image/icon-4399701_1280.webp",
    image_4: "auctionslots_bikes_image/icon-4399701_1280.webp",
    highest_prize: 320000,
    lowest_prize: 280000,
    bike_make: "Suzuki",
    bike_model: "GS 150",
    bike_year: "2020",
    bike_engine_cc: "150",
    bike_color: "Blue",
    bike_mileage: "15000",
    bike_notes: "Live auction — demo user 47 can bid.",
    cnic_number: "35202-1122334-5",
    cnic_image: "uploads/cnic/demo-cnic.jpg",
    demo_bids: [
      { user_id: 47, bidder_name: "Ahmed Khan", bid_amount: 285000 },
      { user_id: 29, bidder_name: "John Malik", bid_amount: 290000 },
      { user_id: 30, bidder_name: "Fatima Ali", bid_amount: 292000 },
    ],
  },
  {
    id: 4,
    user_id: 28,
    auction_status: "completed",
    store_id: 3,
    city: "Lahore",
    currency: "USD",
    category_id: 2,
    category_name: "Scooter",
    item_title: "United US 125 2019",
    image_1: "auctionslots_bikes_image/icon-4399701_1280.webp",
    image_2: "auctionslots_bikes_image/motorbike.png",
    image_3: "auctionslots_bikes_image/motorbike.png",
    image_4: "auctionslots_bikes_image/icon-4399701_1280.webp",
    highest_prize: 200000,
    lowest_prize: 170000,
    bike_make: "United",
    bike_model: "US 125",
    bike_year: "2019",
    bike_engine_cc: "125",
    bike_color: "White",
    bike_mileage: "20000",
    bike_notes: "Completed — settlement forms demo.",
    cnic_number: "35202-9988776-1",
    cnic_image: "uploads/cnic/demo-cnic.jpg",
    winner_user_id: 47,
    winning_bid_amount: 185000,
    payment_forms: {
      userPaid: { confirmed: true, note: "Paid at store counter" },
      counterpartyCredited: { confirmed: true, note: "Seller credited" },
      adminConfirmed: { confirmed: false, note: "" },
    },
  },
];

export const demoIssues = [
  {
    user_id: 28,
    title: "Brake alignment check",
    description: "Customer reported soft rear brake feel after evening return.",
    submit_time: "2026-04-22 18:30:00",
  },
  {
    user_id: 47,
    title: "Wallet top-up delay",
    description: "Recharge confirmation took longer than expected on mobile.",
    submit_time: "2026-04-24 11:05:00",
  },
];

export const demoRidePlaces = [
  "Badshahi Mosque",
  "Lahore Fort",
  "Shalimar Gardens",
  "Anarkali Bazaar",
  "Minar-e-Pakistan",
  "Wagah Border",
];
