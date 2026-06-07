# Bike Auction Hub (Next.js)

Online auction platform for **any item type** (motorcycles, scooters, spare parts, gear, and more). Users list items, bid in live timed auctions, pay through admin bank accounts, and settle via wallet credits. Admins review requests, manage stores, set fees, and close settlements.

**Stack:** Next.js 14 (App Router) · MongoDB (Mongoose) · API routes under `app/api/*`

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Installation (A → Z)](#installation-a--z)
3. [Environment variables](#environment-variables)
4. [Demo accounts](#demo-accounts)
5. [Who does what (User A, User B, Admin)](#who-does-what-user-a-user-b-admin)
6. [Full walkthrough — end to end](#full-walkthrough--end-to-end)
7. [Admin guide](#admin-guide)
8. [User A guide (Ahmed — seller)](#user-a-guide-ahmed--seller)
9. [User B guide (Sara — seller + live auction)](#user-b-guide-sara--seller--live-auction)
10. [Bidder guide (John / Fatima)](#bidder-guide-john--fatima)
11. [Settlement & fees](#settlement--fees)
12. [Auction status flow](#auction-status-flow)
13. [Key routes](#key-routes)
14. [Project structure](#project-structure)
15. [API overview](#api-overview)
16. [Uploading to GitHub (security)](#uploading-to-github-security)
17. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version / notes |
|-------------|-----------------|
| **Node.js** | 18+ recommended |
| **npm** | Comes with Node |
| **MongoDB** | Local (`mongodb://127.0.0.1:27017`) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier |

---

## Installation (A → Z)

### Step 1 — Clone or copy the project

```bash
git clone <your-github-repo-url>
cd FYP_Project
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Create your local environment file

**Do not use committed secrets.** Copy the example file:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Edit `.env.local` and set **your own** `MONGODB_URI` (see [Environment variables](#environment-variables)).

### Step 4 — Start MongoDB

- **Local:** run MongoDB Community Server, or Docker:
  ```bash
  docker run -d -p 27017:27017 --name mongo mongo:7
  ```
- **Atlas:** create a cluster, allow your IP, copy the connection string into `.env.local`.

### Step 5 — Seed demo data

```bash
npm run db:seed
```

This creates admin, four demo users, stores, categories, sample auctions (#1–#4), and platform settings.

### Step 6 — Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| URL | Purpose |
|-----|---------|
| `/signin` | User login |
| `/admin/admin-signin` | Admin login |

---

## Environment variables

Copy from `.env.example` into `.env.local` (never commit `.env.local`).

```env
NEXT_PUBLIC_APP_NAME=Bike Auction Hub

# Local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=ride_rental_hub

# MongoDB Atlas: paste the connection string from Atlas → Connect → Drivers
# MONGODB_URI=<your Atlas connection string>
# MONGODB_DB_NAME=ride_rental_hub

# Google Maps Geocoding (https://console.cloud.google.com/apis/credentials)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Hunter.io email verification (optional)
NEXT_PUBLIC_HUNTER_API_KEY=

SEED_CLEAR_RIDE_DATA=true
FORCE_DNS=false
```

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (**keep private**) |
| `MONGODB_DB_NAME` | Database name (default `ride_rental_hub`) |
| `NEXT_PUBLIC_APP_NAME` | App title in browser |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key for geocoding |
| `NEXT_PUBLIC_HUNTER_API_KEY` | Hunter.io key for email verification (optional) |
| `SEED_CLEAR_RIDE_DATA` | `true` = seed script removes old ride-rental collections |
| `FORCE_DNS` | Set `true` only if DNS errors on your network |

---

## Demo accounts

**Password for all accounts:** `12345678`

| Role | Label | Name | Email | Wallet (after seed) | Demo purpose |
|------|-------|------|-------|---------------------|--------------|
| **Admin** | — | Admin | `admin@example.com` | — | Review, fees, settlement |
| **User A** | Seller / bidder | Ahmed Khan | `demo.user@bikeauction.com` | PKR 3,350 | Pending + approved auctions; can bid on live #3 |
| **User B** | Seller | Sara Khan | `sara.demo@example.com` | PKR 5,000 | Owns **live** auction #3 and **completed** #4 |
| **Bidder 1** | Bidder | John Malik | `john.demo@example.com` | PKR 8,000 | Bid on live auctions (Lahore) |
| **Bidder 2** | Bidder | Fatima Ali | `fatima.demo@example.com` | PKR 7,500 | Bid on live auctions (Lahore) |

### Seeded auctions (after `npm run db:seed`)

| ID | Status | Owner | Notes |
|----|--------|-------|-------|
| **#1** | `pending_review` | User A (Ahmed) | Honda CD 70 — waiting in admin queue |
| **#2** | `approved` | User A (Ahmed) | Yamaha YBR — seller must click **Start auction** within 6h |
| **#3** | `live` | User B (Sara) | Suzuki GS 150 — demo bids already in feed |
| **#4** | `completed` | User B (Sara) | Settlement demo — admin **Successful** tab |

---

## Who does what (User A, User B, Admin)

```
┌─────────────┐     submits request      ┌─────────────┐
│   User A    │ ───────────────────────► │    Admin    │
│  (Ahmed)    │ ◄──── accept / reject ── │             │
└─────────────┘                          └──────┬──────┘
       │                                        │
       │ starts live auction                    │ sets fees, stores,
       ▼                                        │ bank accounts
┌─────────────┐     bids (wallet)        ┌────▼────────┐
│   User B    │ ◄─────────────────────── │  Bidders    │
│   (Sara)    │                          │ John/Fatima │
└─────────────┘                          └─────────────┘
       │
       │ accepts winning bid → completed
       ▼
 Winner pays admin bank → Admin credits seller wallet → Admin final confirm
```

| Actor | Main jobs |
|-------|-----------|
| **User A (Ahmed)** | Create auction requests, start approved auctions, accept bids, choose handover store, receive wallet credit |
| **User B (Sara)** | Same as User A; seed data includes her **live** and **completed** auctions for testing |
| **John / Fatima** | Recharge wallet, bid on live auctions in same city, pay if they win (Won tab) |
| **Admin** | Approve/reject requests, set seller & purchaser fees, bank accounts, credit seller wallet, final close |

---

## Full walkthrough — end to end

Use **three browser windows** (or incognito tabs): Admin, User A, Bidder.

### Phase 1 — Admin setup (5 min)

1. Go to `/admin/admin-signin` → login `admin@example.com` / `12345678`.
2. **Stores** (`/admin/stores`):
   - **Platform fee** tab: set **Seller fee** (1–5%, default 5%) and **Purchaser fee** (0.1–1.9%, default 0.3%).
   - **Winner banks** tab: add up to 3 bank accounts (winners pay here).
   - **Categories** tab: Motorcycle, Scooter, Spare Parts, etc.
   - **Request form** tab: optional — customize auction request field labels.
3. **Auctions** (`/admin/auctionProcess`) → **Review queue**:
   - Open auction **#1** (Honda CD 70).
   - Click **Accept** (or Reject with reason).

### Phase 2 — User A starts selling (10 min)

1. `/signin` → `demo.user@bikeauction.com` / `12345678`.
2. **Auction hub** → `/openAuction`:
   - **My requests**: auction **#2** should show **Approved — start within 6h**.
   - Click **Start auction** (max **3 starts per day**).
3. Optional: **Start auction** tab → submit a **new** item (category, currency, 4 photos, CNIC, policy checkbox).

### Phase 3 — Bidding (10 min)

1. Login as **John** (`john.demo@example.com`) or stay on **User A** to bid on Sara’s auction **#3**.
2. **Wallet** (`/wallet`) → recharge if balance is low (first bid needs deposit + purchaser fee on deposit).
3. **Auction hub** → **Take part** on live auction **#3** (city must match: **Lahore**).
4. Place a bid within min–max range; watch **bid feed** update (~every 5 seconds).

### Phase 4 — Close auction & pick winner (User B)

1. Login as **Sara** (`sara.demo@example.com`).
2. **My requests** → live auction **#3**:
   - **Stop auction** — ends with no winner, OR
   - **Accept bid** — pick a winning bid → status **completed**, fees **locked** at this moment.

### Phase 5 — Winner payment (Won tab)

1. Login as the **winner** (highest bidder or accepted bid user).
2. **Auction hub** → **Won** tab:
   - See admin **bank account(s)** and total (bid + purchaser fee).
   - Transfer money offline, select bank option, tap **I paid online**.

### Phase 6 — Seller handover

1. Login as **seller** (User A or B).
2. **My requests** → completed auction:
   - After buyer paid: choose **handover store** → winner gets pickup notification.
3. Winner marks **Got** when item collected.

### Phase 7 — Admin settlement

1. Admin → **Auctions** → **Successful** tab:
   - **Credit seller** — adds `winning bid − seller fee` to seller wallet.
   - **Final confirm** — auction fully closed.
2. Seller sees wallet balance update and notification.

---

## Admin guide

### Sign in

- URL: `/admin/admin-signin`
- Email: `admin@example.com`
- Password: `12345678`

### Stores & platform (`/admin/stores`)

| Tab | What to do |
|-----|------------|
| **Stores** | Add pickup locations (name, city, address, map coords) |
| **Categories** | Item types for the create form |
| **Platform fee** | Seller % (1–5) and Purchaser % (0.1–1.9) |
| **Winner banks** | Up to 3 accounts shown on winner Won tab |
| **Request form** | Edit labels / required / hide optional fields |

### Auction operations (`/admin/auctionProcess`)

| Tab | What to do |
|-----|------------|
| **Review queue** | Accept / reject pending requests (48h review window) |
| **Successful** | After winner pays: **Credit seller** → **Final confirm** |
| **All status** | View lifecycle + outcome for every auction |
| **Clear data** | Permanently delete an auction (type `DELETE` to confirm) |

### Issues & activity

- `/admin/reportedIssues` — user support tickets
- `/admin/activity` — notification-style event feed

---

## User A guide (Ahmed — seller)

**Login:** `demo.user@bikeauction.com` / `12345678`

### Create a new auction

1. `/openAuction` → **Start auction** tab.
2. Fill category, title, currency (PKR / USD / CAD), price range, store, city.
3. Upload **4 item images** + **CNIC image**.
4. Accept **auction policy** checkbox → **Submit request**.
5. Status becomes **In queue** until admin accepts.

### After approval

1. **My requests** → **Start auction** within **6 hours** (or slot expires).
2. Live auction runs up to **3 hours**, then auto-closes if still live.

### As seller on a live auction

- **Stop auction** — no winner.
- **Accept bid** — one bidder wins; settlement starts.

### After sale (completed)

1. Wait for winner to pay on **Won** tab.
2. Set **handover store** — winner collects item there.
3. Wait for admin to **credit wallet** (you receive bid minus seller fee).

### Wallet

- `/wallet` — recharge for bidding on others’ auctions.
- First bid on an auction deducts **deposit + fee** from wallet (cash not accepted).

---

## User B guide (Sara — seller + live auction)

**Login:** `sara.demo@example.com` / `12345678`

After seed:

- **Auction #3** is already **live** with demo bids — use this to test **Accept bid** or let others bid.
- **Auction #4** is **completed** — use admin **Successful** tab to finish settlement.

Same steps as User A for creating new listings. Sara is the “second seller” in demos when you need two parties.

---

## Bidder guide (John / Fatima)

**John:** `john.demo@example.com` · **Fatima:** `fatima.demo@example.com` · Password: `12345678`

1. Recharge wallet at `/wallet` if needed.
2. `/openAuction` → find **live** auctions in your **city** (Lahore in seed data).
3. **Take part** → enter bid → **Place bid**.
4. If you **win** (or are accepted as winner):
   - Open **Won** tab.
   - Pay total (bid + purchaser fee) to admin bank.
   - Tap **I paid online**.
   - Go to handover store when seller sets it → tap **Got**.

---

## Settlement & fees

| Fee | Who pays | Range | When |
|-----|----------|-------|------|
| **Seller fee** | Deducted from seller credit | 1–5% (admin) | Admin credits seller wallet |
| **Purchaser fee** | Added to winner payment | 0.1–1.9% (admin) | Winner pays admin bank |
| **Bid deposit** | Bidder wallet (first bid only) | Fixed amount + purchaser fee on deposit | First bid on an auction |

**Important:** When an auction is **completed**, fee percentages and amounts are **saved on that auction**. Changing admin fees later does **not** change closed sales.

Settlement steps (all must be confirmed):

1. Winner — **I paid online**
2. Admin — **Credit seller** (wallet `+ winning bid − seller fee`)
3. Admin — **Final confirm**

---

## Auction status flow

```
pending_review → approved → live → completed
                      ↓         ↓
                   expired    stopped
```

| Status | Meaning |
|--------|---------|
| `pending_review` | Waiting for admin (up to 48h display) |
| `approved` | Seller has **6 hours** to click Start auction |
| `live` | Bidding open (max **3 hours**) |
| `completed` | Winner chosen — payment & settlement |
| `expired` | Approved but not started in time |
| `stopped` | Seller stopped without accepting a bid |

---

## Key routes

| Route | Who | Purpose |
|-------|-----|---------|
| `/signin` | User | Login |
| `/signup` | User | Register |
| `/home` | User | Dashboard overview |
| `/openAuction` | User | Bid, create, manage, Won tab |
| `/wallet` | User | Balance & recharge |
| `/profile` | User | Profile settings |
| `/activity` | User | Activity feed |
| `/admin/admin-signin` | Admin | Admin login |
| `/admin/admin-home` | Admin | Overview |
| `/admin/auctionProcess` | Admin | Review & settlements |
| `/admin/stores` | Admin | Stores, fees, banks, form |
| `/admin/reportedIssues` | Admin | Support |
| `/admin/activity` | Admin | Events |

---

## Project structure

```
FYP_Project/
├── app/
│   ├── (user)/          # User pages (home, openAuction, wallet, …)
│   ├── admin/           # Admin pages
│   └── api/             # REST API (auctions, auth, settings, …)
├── src/
│   ├── components/ridehub/   # UI (UserAppShell, AdminAppShell, …)
│   └── lib/
│       ├── server/           # MongoDB models, helpers, settings
│       └── mockData.js       # Demo users & seed auctions
├── scripts/
│   └── seed-mongo.mjs        # Database seed
├── public/uploads/           # Uploaded images (gitignored)
├── .env.example              # Template — safe to commit
└── .env.local                # Your secrets — NEVER commit
```

---

## API overview

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/auctions` | GET, POST, PUT, PATCH | List, bid, create, actions |
| `/api/auth/login` | POST | User login |
| `/api/auth/signup` | POST | Register |
| `/api/admin/login` | POST | Admin login |
| `/api/stores` | GET, POST, PATCH | Pickup stores |
| `/api/categories` | GET, POST, PATCH, DELETE | Categories |
| `/api/settings` | GET, PATCH | Platform fees & banks |
| `/api/users/[id]/wallet` | GET, POST | Wallet balance & recharge |
| `/api/notifications` | GET, PATCH | User/admin notifications |

### Auction PATCH `action` values

| Action | Who | Purpose |
|--------|-----|---------|
| `accept` / `reject` | Admin | Review queue |
| `start` | Seller | Start approved auction |
| `stop` | Seller | End live without winner |
| `accept_prize` | Seller | Pick winning bid |
| `set_handover_store` | Seller | Pickup location |
| `mark_item_got` | Winner | Confirm item received |
| `settlement` | User / Admin | Payment & credit forms |
| `purge` | Admin | Delete auction data |

---

## Uploading to GitHub (security)

Before `git push`:

1. **Never commit** `.env.local`, `.env`, or any file with real `MONGODB_URI` / passwords.
2. This repo `.gitignore` already excludes `.env*` except `.env.example`.
3. Verify:
   ```bash
   git status
   ```
   You should **not** see `.env.local` in staged files.
4. Only commit `.env.example` with placeholder values.
5. Add a short note in your repo description: *“Copy `.env.example` to `.env.local` and add your MongoDB URI.”*

If you accidentally pushed secrets, rotate your Atlas password immediately and use `git filter-repo` or GitHub secret scanning guidance to remove them from history.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Missing MONGODB_URI` | Create `.env.local` from `.env.example` |
| Seed fails | Ensure MongoDB is running; check URI |
| Empty auction list | Run `npm run db:seed` |
| Cannot bid — city | Bidder city must match auction city (Lahore in demo) |
| Cannot bid — wallet | Recharge at `/wallet`; first bid needs deposit + fee |
| Admin login fails | Re-run seed; use `admin@example.com` / `12345678` |
| Port 3000 in use | `npm run dev:stop` then `npm run dev` |
| Build / DNS errors | Try `FORCE_DNS=true` in `.env.local` |

### Reseed database

```bash
npm run db:seed
```

Clears demo auction rows and reloads users, stores, categories, and auctions #1–#4.

---

## License & FYP note

Final Year Project — educational use. Demo passwords and bank account numbers in seed data are **not real**.
