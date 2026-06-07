"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearStoredSession,
  readStoredSession,
  USER_SESSION_KEY,
  ADMIN_SESSION_KEY,
  writeStoredSession,
} from "@/lib/session";
import {
  getAdminFleet,
  getAuctionSlots,
  getReportedIssues,
  getRideHistory,
  getRidePlaces,
  getStores,
  getStoreBikes,
  getUserProfile,
  getWalletBalance,
  loginAdmin,
  loginUser,
  registerUser,
  requestPasswordReset,
} from "@/lib/legacyApi";

const userNav = [
  { key: "home", label: "Overview" },
  { key: "dashboard", label: "Stores" },
  { key: "wallet", label: "Wallet" },
  { key: "openAuction", label: "Auctions" },
  { key: "onRide", label: "Rides" },
  { key: "profile", label: "Profile" },
  { key: "settings", label: "Settings" },
];

const adminNav = [
  { key: "admin-home", label: "Overview" },
  { key: "rentalProcess", label: "Rental ops" },
  { key: "auctionProcess", label: "Auctions" },
  { key: "reportedIssues", label: "Issues" },
];

const userTitles = {
  home: "Dashboard",
  dashboard: "Store Network",
  wallet: "Wallet",
  openAuction: "Auction Market",
  onRide: "Ride History",
  profile: "Profile",
  settings: "Settings",
};

const adminTitles = {
  "admin-home": "Operations Overview",
  rentalProcess: "Rental Operations",
  auctionProcess: "Auction Management",
  reportedIssues: "Issue Desk",
};

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function resolveUserRoute(slug = []) {
  if (!slug.length) {
    return "signin";
  }

  return slug[0];
}

function resolveAdminRoute(slug = []) {
  if (!slug.length) {
    return "admin-signin";
  }

  return slug[0];
}

function FeatureStat({ label, value, hint }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{hint}</span>
    </article>
  );
}

function AuthField({ label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}

function EmptyState({ title, copy }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}

function UserAuth({ route, onLogin }) {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "", username: "" });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignup = route === "signup";
  const isForgot = route === "forgotPassword";

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setNote("");

    try {
      if (isSignup) {
        const response = await registerUser(credentials);
        setNote(response.message || "Signup request submitted.");
        router.push("/signin");
        return;
      }

      if (isForgot) {
        const response = await requestPasswordReset({ email: credentials.email });
        setNote(response.message || "Reset request submitted.");
        return;
      }

      const result = await loginUser(credentials);
      setNote(result.message);
      onLogin(result.session);
      router.push("/home");
    } catch (error) {
      setNote(error.message || "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-panel intro user-intro">
        <div className="auth-intro-top">
          <p className="eyebrow">Bike Auction Hub</p>
          <h1>Urban bike rentals with a cleaner booking flow.</h1>
          <p>
            Discover stations, reserve faster, manage your balance, and keep every trip in one calm workspace.
          </p>
        </div>
        <div className="auth-highlight-grid">
          <FeatureStat label="Active stations" value="12" hint="Citywide pickup network" />
          <FeatureStat label="Fast booking" value="2 min" hint="Search to confirmation" />
          <FeatureStat label="Top-up ready" value="24/7" hint="Wallet-based checkout" />
        </div>
        <div className="intro-strip">
          <span>Rides</span>
          <span>Wallet</span>
          <span>Stations</span>
          <span>Auctions</span>
        </div>
      </section>

      <section className="auth-panel form">
        <p className="panel-kicker">Account access</p>
        <h2>
          {isSignup ? "Signup" : isForgot ? "Reset password" : "Login"}
        </h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <AuthField
              label="Username"
              value={credentials.username}
              onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              placeholder="Your rider name"
            />
          ) : null}

          <AuthField
            label="Email"
            type="email"
            value={credentials.email}
            onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
            placeholder="you@example.com"
          />

          {!isForgot ? (
            <AuthField
              label="Password"
              type="password"
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter password"
            />
          ) : null}

          <button className="hero-button primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : isSignup ? "Signup" : isForgot ? "Send reset link" : "Login"}
          </button>
        </form>

        {note ? <p className="status-note">{note}</p> : null}

        <div className="auth-links">
          <Link href="/signin">Login</Link>
          <Link href="/signup">Signup</Link>
          <Link href="/forgotPassword">Forgot password</Link>
        </div>
      </section>
    </div>
  );
}

function AdminAuth({ onLogin }) {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setNote("");
    try {
      const result = await loginAdmin(credentials);
      setNote(result.message);
      onLogin(result.session);
      router.push("/admin/admin-home");
    } catch (error) {
      setNote(error.message || "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell admin">
      <section className="auth-panel intro admin-intro">
        <div className="auth-intro-top">
          <p className="eyebrow">Admin control room</p>
          <h1>Rental operations, inventory, and issue handling in one place.</h1>
          <p>Built for store managers who need a sharp operational view instead of clutter.</p>
        </div>
        <div className="auth-highlight-grid">
          <FeatureStat label="Fleet health" value="92%" hint="Available or ready-to-ride inventory" />
          <FeatureStat label="Open issues" value="6" hint="Across customer and bike operations" />
          <FeatureStat label="Auction queue" value="4" hint="Pending approval items" />
        </div>
      </section>

      <section className="auth-panel form">
        <p className="panel-kicker">Admin access</p>
        <h2>Login</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthField
            label="Admin email"
            type="email"
            value={credentials.email}
            onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
            placeholder="admin@example.com"
          />
          <AuthField
            label="Password"
            type="password"
            value={credentials.password}
            onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
            placeholder="Enter password"
          />
          <button className="hero-button primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : "Login"}
          </button>
        </form>

        {note ? <p className="status-note">{note}</p> : null}
      </section>
    </div>
  );
}

function UserWorkspace({ route, session, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [stores, setStores] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeBikes, setStoreBikes] = useState([]);
  const [ridePlaces, setRidePlaces] = useState([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingStoreData, setLoadingStoreData] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingWorkspace(true);
      const [profileData, storeData, walletData, historyData, auctionData] = await Promise.all([
        getUserProfile(session.user_id),
        getStores(),
        getWalletBalance(session.user_id),
        getRideHistory(session.user_id),
        getAuctionSlots(),
      ]);

      setProfile(profileData);
      setStores(storeData);
      setWallet(walletData);
      setHistory(historyData);
      setAuctions(auctionData);

      const firstStore = storeData[0];
      if (firstStore) {
        setSelectedStore(firstStore);
      }
      setLoadingWorkspace(false);
    }

    load();
  }, [session.user_id]);

  useEffect(() => {
    async function loadStoreData() {
      if (!selectedStore?._id) {
        return;
      }

      setLoadingStoreData(true);
      const [bikes, places] = await Promise.all([
        getStoreBikes(selectedStore._id),
        getRidePlaces(selectedStore._id),
      ]);

      setStoreBikes(bikes);
      setRidePlaces(places);
      setLoadingStoreData(false);
    }

    loadStoreData();
  }, [selectedStore]);

  const availableBikes = storeBikes.filter((bike) => String(bike.bikeBookingStatus).trim() === "available");
  const bookedBikes = storeBikes.filter((bike) => String(bike.bikeBookingStatus).trim() !== "available");

  const content = useMemo(() => {
    if (loadingWorkspace || !profile || !wallet) {
      return <EmptyState title="Loading workspace" copy="Fetching rider profile, stores, wallet, and ride data." />;
    }

    if (route === "dashboard") {
      return (
        <section className="workspace-grid two-column">
          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Rental stores</p>
                <h2>Choose a store</h2>
              </div>
            </div>
            <div className="store-list">
              {stores.map((store) => (
                <button
                  className={`store-row ${selectedStore?._id === store._id ? "active" : ""}`}
                  key={store._id}
                  onClick={() => setSelectedStore(store)}
                  type="button"
                >
                  <div>
                    <strong>{store.storeName}</strong>
                    <span>
                      {store.location?.city} • {store.status}
                    </span>
                  </div>
                  <b>{store.bikeleft} bikes</b>
                </button>
              ))}
            </div>
          </article>

          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Selected store</p>
                <h2>{selectedStore?.storeName || "No store selected"}</h2>
              </div>
            </div>
            <div className="chip-row">
              {(selectedStore?.types_of_bike || []).map((type) => (
                <span className="soft-chip" key={type}>
                  {type}
                </span>
              ))}
            </div>
            <div className="inventory-metrics">
              <FeatureStat label="Available now" value={availableBikes.length} hint="Ready for booking" />
              <FeatureStat label="Busy" value={bookedBikes.length} hint="Currently assigned" />
            </div>
            <div className="ride-place-list">
              {ridePlaces.map((place) => (
                <span key={place}>{place}</span>
              ))}
            </div>
          </article>

          <article className="surface-panel span-full">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Bike inventory</p>
                <h2>Fleet by store</h2>
              </div>
            </div>
            <div className="inventory-table">
              {loadingStoreData ? (
                <EmptyState title="Loading store data" copy="Fetching bikes and ride places for the selected store." />
              ) : (
                storeBikes.map((bike) => (
                <div className="inventory-row" key={bike.id}>
                  <div>
                    <strong>{bike.type}</strong>
                    <span>Bike #{bike.id}</span>
                  </div>
                  <div>{currency(bike.pricePerHour)}/hr</div>
                  <div className={`badge-pill ${String(bike.bikeBookingStatus).trim() === "available" ? "success" : "warning"}`}>
                    {String(bike.bikeBookingStatus).trim()}
                  </div>
                  <div>{bike.booking?.location || "Ready at station"}</div>
                </div>
                ))
              )}
            </div>
          </article>
        </section>
      );
    }

    if (route === "wallet") {
      return (
        <section className="workspace-grid two-column">
          <article className="surface-panel">
            <p className="panel-kicker">Balance</p>
            <h2>{currency(wallet.remainingBalance)}</h2>
            <p className="support-copy">Wallet supports fast checkout and keeps rental approvals moving.</p>
            <div className="wallet-actions">
              <button className="hero-button primary" type="button">
                Recharge
              </button>
              <button className="hero-button secondary" type="button">
                Export statement
              </button>
            </div>
          </article>

          <article className="surface-panel">
            <p className="panel-kicker">Recent rides</p>
            <h2>Usage snapshot</h2>
            <div className="mini-list">
              {history.map((ride) => (
                <div className="mini-row" key={`${ride.bike_id}-${ride.start_time}`}>
                  <div>
                    <strong>{ride.bike_type}</strong>
                    <span>{ride.location}</span>
                  </div>
                  <b>{currency(ride.bike_type?.includes("Electric") ? 220 : 110)}</b>
                </div>
              ))}
            </div>
          </article>
        </section>
      );
    }

    if (route === "openAuction") {
      return (
        <section className="workspace-grid">
          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Marketplace</p>
                <h2>Open auction slots</h2>
              </div>
            </div>
            <div className="auction-grid">
              {auctions.map((slot) => (
                <div className="auction-card" key={slot.id}>
                  <div className="auction-badge">Slot #{slot.id}</div>
                  <h3>{slot.username}</h3>
                  <p>
                    Starting at {currency(slot.lowest_prize)} with a current top bid of {currency(slot.highest_prize)}.
                  </p>
                  <div className="auction-meta">
                    <span>User #{slot.user_id}</span>
                    <button className="hero-button primary" type="button">
                      Place bid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      );
    }

    if (route === "onRide") {
      return (
        <section className="workspace-grid">
          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Ride log</p>
                <h2>Booking history</h2>
              </div>
            </div>
            <div className="timeline-list">
              {history.map((ride) => (
                <div className="timeline-row" key={`${ride.bike_id}-${ride.start_time}`}>
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <div className="timeline-topline">
                      <strong>{ride.bike_type}</strong>
                      <span className="badge-pill success">{ride.status}</span>
                    </div>
                    <p>{ride.location}</p>
                    <small>
                      {formatDate(ride.start_time)} to {formatDate(ride.end_time)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      );
    }

    if (route === "profile") {
      return (
        <section className="workspace-grid two-column">
          <article className="surface-panel">
            <p className="panel-kicker">Identity</p>
            <h2>{profile.name}</h2>
            <div className="profile-grid">
              <div>
                <span>Email</span>
                <strong>{profile.email}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{profile.phoneNumber || "Add phone number"}</strong>
              </div>
              <div>
                <span>Address</span>
                <strong>{profile.address || "Add address"}</strong>
              </div>
              <div>
                <span>Languages</span>
                <strong>{profile.languages || "Not set"}</strong>
              </div>
            </div>
          </article>

          <article className="surface-panel">
            <p className="panel-kicker">Awards</p>
            <h2>Trust and activity</h2>
            <div className="award-list">
              {profile.awards?.length ? (
                profile.awards.map((award) => (
                  <div className="award-row" key={award.title}>
                    <strong>{award.title}</strong>
                    <span>{award.description}</span>
                  </div>
                ))
              ) : (
                <EmptyState title="No awards yet" copy="As the user engages more, achievements can be shown here." />
              )}
            </div>
          </article>
        </section>
      );
    }

    if (route === "settings") {
      return (
        <section className="workspace-grid two-column">
          <article className="surface-panel">
            <p className="panel-kicker">Account</p>
            <h2>Security settings</h2>
            <div className="settings-list">
              <div className="settings-row">
                <div>
                  <strong>Password</strong>
                  <span>Change or reset account password</span>
                </div>
                <button className="hero-button secondary" type="button">
                  Update
                </button>
              </div>
              <div className="settings-row">
                <div>
                  <strong>Profile verification</strong>
                  <span>Upload required identity information</span>
                </div>
                <button className="hero-button secondary" type="button">
                  Review
                </button>
              </div>
            </div>
          </article>

          <article className="surface-panel danger-panel">
            <p className="panel-kicker">Careful</p>
            <h2>Account actions</h2>
            <p>Backend delete-account support is preserved and can be reconnected when hosting is available.</p>
            <button className="hero-button danger" onClick={onLogout} type="button">
              Sign out
            </button>
          </article>
        </section>
      );
    }

    return (
      <section className="workspace-grid">
        <article className="surface-panel hero-surface">
          <p className="panel-kicker">Welcome back</p>
          <h2>{profile.name}, your next ride is ready.</h2>
          <p className="support-copy">
            Browse stores, reserve bikes faster, and keep your wallet ready for weekend demand.
          </p>
          <div className="overview-stats">
            <FeatureStat label="Wallet" value={currency(wallet.remainingBalance)} hint="Available credit" />
            <FeatureStat label="Open stores" value={stores.length} hint="Ready to browse" />
            <FeatureStat label="Ride history" value={history.length} hint="Completed bookings" />
            <FeatureStat label="Live auctions" value={auctions.length} hint="Open opportunity slots" />
          </div>
        </article>

        <section className="workspace-grid two-column">
          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Fast reserve</p>
                <h2>Store spotlight</h2>
              </div>
            </div>
            {stores.slice(0, 2).map((store) => (
              <div className="mini-row store" key={store._id}>
                <div>
                  <strong>{store.storeName}</strong>
                  <span>
                    {store.location?.city} • {store.status}
                  </span>
                </div>
                <b>{store.bikeleft}</b>
              </div>
            ))}
          </article>

          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Recent activity</p>
                <h2>Last ride</h2>
              </div>
            </div>
            {history[0] ? (
              <div className="journey-card">
                <strong>{history[0].bike_type}</strong>
                <span>{history[0].location}</span>
                <small>{formatDate(history[0].start_time)}</small>
              </div>
            ) : (
              <EmptyState title="No rides yet" copy="As soon as bookings start, activity will show here." />
            )}
          </article>
        </section>
      </section>
    );
  }, [auctions, history, profile, ridePlaces, route, selectedStore, stores, storeBikes, wallet, availableBikes.length, bookedBikes.length, onLogout]);

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">Bike Auction Hub</p>
          <h2>Rider workspace</h2>
          <span>Booking, balance, and ride activity</span>
        </div>
        <nav className="nav-stack">
          {userNav.map((item) => (
            <Link className={route === item.key ? "nav-pill active" : "nav-pill"} href={`/${item.key}`} key={item.key}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="hero-button secondary sidebar-button" onClick={onLogout} type="button">
          Sign out
        </button>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="panel-kicker">Customer workspace</p>
            <h1>{userTitles[route] || "Dashboard"}</h1>
          </div>
          <div className="identity-chip">
            <strong>{profile?.name || session.email}</strong>
            <span>{session.email}</span>
          </div>
        </header>
        {content}
      </main>
    </div>
  );
}

function AdminWorkspace({ route, session, onLogout }) {
  const [stores, setStores] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  useEffect(() => {
    async function load() {
      setLoadingWorkspace(true);
      const [storeData, fleetData, auctionData, issueData] = await Promise.all([
        getStores(),
        getAdminFleet(session.store_id),
        getAuctionSlots(),
        getReportedIssues(),
      ]);

      setStores(storeData);
      setFleet(fleetData);
      setAuctions(auctionData);
      setIssues(issueData);
      setLoadingWorkspace(false);
    }

    load();
  }, [session.store_id]);

  const availableFleet = fleet.filter((bike) => String(bike.bikeBookingStatus).trim() === "available");
  const bookedFleet = fleet.filter((bike) => String(bike.bikeBookingStatus).trim() !== "available");

  const content = useMemo(() => {
    if (loadingWorkspace) {
      return <EmptyState title="Loading workspace" copy="Fetching fleet, stores, issues, and auction activity." />;
    }

    if (route === "rentalProcess") {
      return (
        <section className="workspace-grid">
          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Rental operations</p>
                <h2>Fleet by booking status</h2>
              </div>
            </div>
            <div className="inventory-table">
              {fleet.map((bike) => (
                <div className="inventory-row" key={bike.id}>
                  <div>
                    <strong>{bike.type}</strong>
                    <span>Store #{bike.store_id}</span>
                  </div>
                  <div>{currency(bike.pricePerHour)}/hr</div>
                  <div className={`badge-pill ${String(bike.bikeBookingStatus).trim() === "available" ? "success" : "warning"}`}>
                    {String(bike.bikeBookingStatus).trim()}
                  </div>
                  <div>{bike.booking?.location || "At station"}</div>
                </div>
              ))}
            </div>
          </article>
        </section>
      );
    }

    if (route === "auctionProcess") {
      return (
        <section className="workspace-grid">
          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Auction moderation</p>
                <h2>Pending and live slots</h2>
              </div>
            </div>
            <div className="auction-grid">
              {auctions.map((slot) => (
                <div className="auction-card" key={slot.id}>
                  <div className="auction-badge">Slot #{slot.id}</div>
                  <h3>{slot.username}</h3>
                  <p>
                    Current bid {currency(slot.highest_prize)} with floor price {currency(slot.lowest_prize)}.
                  </p>
                  <div className="auction-meta">
                    <span>User #{slot.user_id}</span>
                    <button className="hero-button secondary" type="button">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      );
    }

    if (route === "reportedIssues") {
      return (
        <section className="workspace-grid">
          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Issue queue</p>
                <h2>Customer-reported issues</h2>
              </div>
            </div>
            <div className="issue-list">
              {issues.map((issue, index) => (
                <div className="issue-row" key={`${issue.user_id}-${index}`}>
                  <div>
                    <strong>{issue.title}</strong>
                    <span>User #{issue.user_id}</span>
                  </div>
                  <p>{issue.description}</p>
                  <small>{formatDate(issue.submit_time)}</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      );
    }

    return (
      <section className="workspace-grid">
        <article className="surface-panel hero-surface admin-hero">
          <p className="panel-kicker">Store overview</p>
          <h2>One place for rentals, auctions, and support tickets.</h2>
          <div className="overview-stats">
            <FeatureStat label="Stores" value={stores.length} hint="Connected branches" />
            <FeatureStat label="Available fleet" value={availableFleet.length} hint="Ready now" />
            <FeatureStat label="Busy fleet" value={bookedFleet.length} hint="Active bookings" />
            <FeatureStat label="Issues" value={issues.length} hint="Need attention" />
          </div>
        </article>

        <section className="workspace-grid two-column">
          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Branch status</p>
                <h2>Store health</h2>
              </div>
            </div>
            {stores.map((store) => (
              <div className="mini-row store" key={store._id}>
                <div>
                  <strong>{store.storeName}</strong>
                  <span>{store.location?.address}</span>
                </div>
                <b>{store.status}</b>
              </div>
            ))}
          </article>

          <article className="surface-panel">
            <div className="section-head">
              <div>
                <p className="panel-kicker">Issue spotlight</p>
                <h2>Latest report</h2>
              </div>
            </div>
            {issues[0] ? (
              <div className="journey-card">
                <strong>{issues[0].title}</strong>
                <span>{issues[0].description}</span>
                <small>{formatDate(issues[0].submit_time)}</small>
              </div>
            ) : (
              <EmptyState title="No active issues" copy="When customers report issues, they will appear here." />
            )}
          </article>
        </section>
      </section>
    );
  }, [auctions, availableFleet.length, bookedFleet.length, fleet, issues, loadingWorkspace, route, stores]);

  return (
    <div className="workspace-shell admin-shell">
      <aside className="workspace-sidebar admin-sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">Bike Auction Hub</p>
          <h2>Admin control</h2>
          <span>Fleet, auctions, and issue resolution</span>
        </div>
        <nav className="nav-stack">
          {adminNav.map((item) => (
            <Link className={route === item.key ? "nav-pill active" : "nav-pill"} href={`/admin/${item.key}`} key={item.key}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="hero-button secondary sidebar-button" onClick={onLogout} type="button">
          Sign out
        </button>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header">
          <div>
            <p className="panel-kicker">Admin workspace</p>
            <h1>{adminTitles[route] || "Operations Overview"}</h1>
          </div>
          <div className="identity-chip">
            <strong>Store #{session.store_id}</strong>
            <span>{session.email}</span>
          </div>
        </header>
        {content}
      </main>
    </div>
  );
}

export function RideHubUserApp({ slug }) {
  const route = resolveUserRoute(slug);
  const [session, setSession] = useState(null);
  const authRoutes = new Set(["signin", "signup", "forgotPassword", "resetPassword", "verifyOtp"]);

  useEffect(() => {
    setSession(readStoredSession(USER_SESSION_KEY));
  }, []);

  function handleLogin(payload) {
    writeStoredSession(USER_SESSION_KEY, payload);
    setSession(payload);
  }

  function handleLogout() {
    clearStoredSession(USER_SESSION_KEY);
    setSession(null);
  }

  if (!session) {
    return <UserAuth route={route} onLogin={handleLogin} />;
  }

  if (authRoutes.has(route)) {
    return <UserWorkspace route="home" session={session} onLogout={handleLogout} />;
  }

  return <UserWorkspace route={route} session={session} onLogout={handleLogout} />;
}

export function RideHubAdminApp({ slug }) {
  const route = resolveAdminRoute(slug);
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(readStoredSession(ADMIN_SESSION_KEY));
  }, []);

  function handleLogin(payload) {
    writeStoredSession(ADMIN_SESSION_KEY, payload);
    setSession(payload);
  }

  function handleLogout() {
    clearStoredSession(ADMIN_SESSION_KEY);
    setSession(null);
  }

  if (!session) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  if (route === "admin-signin") {
    return <AdminWorkspace route="admin-home" session={session} onLogout={handleLogout} />;
  }

  return <AdminWorkspace route={route} session={session} onLogout={handleLogout} />;
}
