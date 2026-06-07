"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HiBell, HiClock, HiCog6Tooth, HiHome, HiTicket, HiUserCircle, HiWallet } from "react-icons/hi2";
import { toMessagePayload, useAppMessage } from "@/components/ridehub/AppMessageBox";
import { clearStoredSession, readStoredSession, USER_SESSION_KEY } from "@/lib/session";
import {
  getNotifications,
  getAuctionSlotsByFilter,
  getUserActivity,
  getStores,
  getUserProfile,
  getWalletBalance,
  markNotificationsRead,
  rechargeWallet,
  submitIssue,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/legacyApi";
import { UserAppContext, useUserApp } from "./userAppContext";
import { InfoGrid, InfoTile } from "./InfoGrid";

function notificationActionHref(item) {
  const auctionId = item?.metadata?.auctionId;
  if (item?.type === "auction_won") {
    return auctionId ? `/openAuction?tab=won&auction=${auctionId}` : "/openAuction?tab=won";
  }
  if (item?.type === "pickup_ready") {
    return auctionId ? `/openAuction?tab=won&auction=${auctionId}` : "/openAuction?tab=won";
  }
  if (item?.type === "buyer_payment_received") {
    return "/openAuction?tab=mine";
  }
  if (["auction_sold", "auction_approved", "auction_rejected", "auction_live", "auction_started"].includes(item?.type)) {
    return "/openAuction?tab=mine";
  }
  if (["auction_lost", "auction_stopped", "auction_auto_stopped"].includes(item?.type)) {
    return "/openAuction?tab=participate";
  }
  return null;
}

export { useUserApp };

const navItems = [
  { href: "/home", label: "Overview", icon: HiHome },
  { href: "/openAuction", label: "Auction hub", icon: HiTicket },
  { href: "/wallet", label: "Wallet", icon: HiWallet },
  { href: "/activity", label: "Activity", icon: HiClock },
  { href: "/profile", label: "Profile", icon: HiUserCircle },
  { href: "/settings", label: "Settings", icon: HiCog6Tooth },
];

const titles = {
  "/home": {
    title: "Auction overview",
    note: "Track requests, live auctions, wallet balance, and notifications.",
  },
  "/openAuction": {
    title: "Auction hub",
    note: "Take part in live auctions or submit your bike for admin review.",
  },
  "/wallet": {
    title: "Wallet",
    note: "Balance for auction-related payments and settlements.",
  },
  "/profile": {
    title: "Profile",
    note: "Your identity, contact details, and achievements.",
  },
  "/activity": {
    title: "Activity",
    note: "Auction and account events in one timeline.",
  },
  "/settings": {
    title: "Settings",
    note: "Security, password, and support.",
  },
};

function currency(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(String(value).replace(" ", "T"));
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

function LoadingState({ title, copy }) {
  return (
    <div className="loading-state">
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, copy }) {
  return (
    <div className="empty-state">
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </div>
  );
}

function PaymentDialog({ open, amount, onClose, onSubmit, submitting, payment, setPayment }) {
  if (!open) return null;
  return (
    <div className="dialog-overlay app-dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog-card app-dialog-card app-dialog-prompt">
        <div className="app-dialog-icon dialog-icon-info">
          <HiWallet aria-hidden="true" />
        </div>
        <p className="section-kicker">Wallet recharge</p>
        <h3>Confirm payment</h3>
        <p className="app-dialog-message">Complete payment details to recharge your wallet.</p>
        <div className="stack-form">
          <input value={`Amount: ${amount}`} disabled readOnly type="text" />
          <select value={payment.method} onChange={(event) => setPayment((current) => ({ ...current, method: event.target.value }))}>
            <option value="card">Credit/Debit Card</option>
            <option value="bank">Bank Transfer</option>
            <option value="wallet">Mobile Wallet</option>
          </select>
          <input
            type="text"
            placeholder="Card holder name"
            value={payment.holder}
            onChange={(event) => setPayment((current) => ({ ...current, holder: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Card number"
            value={payment.cardNo}
            onChange={(event) => setPayment((current) => ({ ...current, cardNo: event.target.value }))}
          />
          <div className="inline-actions">
            <input
              type="text"
              placeholder="MM/YY"
              value={payment.expiry}
              onChange={(event) => setPayment((current) => ({ ...current, expiry: event.target.value }))}
            />
            <input
              type="password"
              placeholder="CVV"
              value={payment.cvv}
              onChange={(event) => setPayment((current) => ({ ...current, cvv: event.target.value }))}
            />
          </div>
        </div>
        <div className="app-dialog-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="primary-button" disabled={submitting} onClick={onSubmit} type="button">
            {submitting ? "Processing..." : "Pay & Recharge"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserAppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showMessage } = useAppMessage();
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [stores, setStores] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [ownedAuctions, setOwnedAuctions] = useState([]);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activityItems, setActivityItems] = useState([]);

  useEffect(() => {
    const stored = readStoredSession(USER_SESSION_KEY);
    setSession(stored || null);
    if (!stored) {
      router.replace("/signin");
    }
  }, [router]);

  useEffect(() => {
    if (!session?.user_id) {
      return;
    }

    let ignore = false;

    async function loadWorkspace() {
      setLoadingWorkspace(true);

      try {
        const [profileData, storeData, walletData, owned, live, won] = await Promise.all([
          getUserProfile(session.user_id),
          getStores(),
          getWalletBalance(session.user_id),
          getAuctionSlotsByFilter({ userId: session.user_id, scope: "owned", status: "all" }),
          getAuctionSlotsByFilter({ userId: session.user_id, scope: "participable", status: "all" }),
          getAuctionSlotsByFilter({ userId: session.user_id, scope: "won", status: "all" }),
        ]);

        if (ignore) {
          return;
        }

        setProfile(profileData);
        setStores(storeData);
        setWallet(walletData);
        setOwnedAuctions(owned);
        setLiveAuctions(live);
        setWonAuctions(won);
      } finally {
        if (!ignore) {
          setLoadingWorkspace(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      ignore = true;
    };
  }, [session?.user_id]);

  useEffect(() => {
    if (!session?.user_id) {
      return;
    }
    let ignore = false;
    async function loadNotificationsAndActivity() {
      const [notificationData, activityData, walletData] = await Promise.all([
        getNotifications({ role: "user", userId: session.user_id, limit: 12 }),
        getUserActivity(session.user_id),
        getWalletBalance(session.user_id),
      ]);
      if (ignore) return;
      setNotifications(notificationData.data || []);
      setUnreadCount(notificationData.unreadCount || 0);
      setActivityItems(activityData || []);
      setWallet(walletData);
    }
    loadNotificationsAndActivity();
    const timer = setInterval(loadNotificationsAndActivity, 5000);
    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [session?.user_id]);

  async function refreshWorkspace() {
    if (!session?.user_id) {
      return;
    }
    const [walletData, storeData, owned, live, won] = await Promise.all([
      getWalletBalance(session.user_id),
      getStores(),
      getAuctionSlotsByFilter({ userId: session.user_id, scope: "owned", status: "all" }),
      getAuctionSlotsByFilter({ userId: session.user_id, scope: "participable", status: "all" }),
      getAuctionSlotsByFilter({ userId: session.user_id, scope: "won", status: "all" }),
    ]);
    setWallet(walletData);
    setStores(storeData);
    setOwnedAuctions(owned);
    setLiveAuctions(live);
    setWonAuctions(won);
  }

  async function refreshNotifications() {
    if (!session?.user_id) return;
    const notificationData = await getNotifications({ role: "user", userId: session.user_id, limit: 12 });
    setNotifications(notificationData.data || []);
    setUnreadCount(notificationData.unreadCount || 0);
  }

  const setActionMessage = useCallback(
    (payload) => {
      showMessage(toMessagePayload(payload));
    },
    [showMessage]
  );

  const contextValue = useMemo(
    () => ({
      session,
      profile,
      stores,
      wallet,
      ownedAuctions,
      liveAuctions,
      wonAuctions,
      loadingWorkspace,
      setWallet,
      refreshWorkspace,
      refreshNotifications,
      setProfile,
      setActionMessage,
      notifications,
      unreadCount,
      showNotifications,
      setShowNotifications,
      activityItems,
      currency,
      formatDate,
    }),
    [
      session,
      profile,
      stores,
      wallet,
      ownedAuctions,
      liveAuctions,
      wonAuctions,
      loadingWorkspace,
      setActionMessage,
      refreshNotifications,
      notifications,
      unreadCount,
      showNotifications,
      activityItems,
    ]
  );

  function handleLogout() {
    clearStoredSession(USER_SESSION_KEY);
    router.push("/signin");
  }

  if (session === undefined) {
    return <LoadingState title="Preparing workspace" copy="Checking your session." />;
  }

  if (session === null) {
    return null;
  }

  const heading = titles[pathname] || titles["/home"];

  async function handleMarkNotificationsRead() {
    if (!session?.user_id || !unreadCount) {
      return;
    }
    await markNotificationsRead({
      role: "user",
      userId: session.user_id,
      markAll: true,
    });
    setUnreadCount(0);
    setNotifications((current) => current.map((entry) => ({ ...entry, is_read: true })));
  }

  return (
    <UserAppContext.Provider value={contextValue}>
      <div className="app-shell user-mode">
        <aside className="sidebar-shell">
          <div className="brand-block">
            <div className="brand-badge">BA</div>
            <div className="brand-copy">
              <h2>{process.env.NEXT_PUBLIC_APP_NAME || "Bike Auction Hub"}</h2>
              <p>User workspace</p>
            </div>
          </div>

          <nav className="nav-group">
            {navItems.map((item) => (
              (() => {
                const Icon = item.icon;
                return (
                  <Link
                    className={`nav-button ${pathname === item.href ? "active" : ""}`}
                    href={item.href}
                    key={item.href}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {Icon ? <Icon className="nav-icon" /> : <span className="nav-icon nav-icon-fallback" />}
                    <strong className="nav-label">{item.label}</strong>
                  </Link>
                );
              })()
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="identity-chip">
              <strong>{profile?.name || session.email}</strong>
              <span>{profile?.email || session.email}</span>
            </div>
            <button className="secondary-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <div className="content-shell">
          <header className="topbar">
            <div className="content-head">
              <p className="section-kicker">Auction workspace</p>
              <h2>{heading.title}</h2>
              <p>{heading.note}</p>
            </div>
            <div className="topbar-actions">
              <Link className="wallet-chip" href="/wallet" title="Wallet balance">
                <HiWallet className="button-icon" />
                <span>{currency(wallet?.remainingBalance || 0)}</span>
              </Link>
              <button className="secondary-button notification-button" onClick={() => setShowNotifications((current) => !current)} type="button">
                {HiBell ? <HiBell className="button-icon" /> : null}
                Notifications
                {unreadCount ? <span className="notif-badge notif-dot">{unreadCount}</span> : null}
              </button>
              <Link className="primary-button" href="/openAuction">
                Auction hub
              </Link>
            </div>
          </header>
          {showNotifications ? (
            <div className="section-card notification-panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Notification center</p>
                  <h3>Latest updates</h3>
                </div>
                <button className="secondary-button" onClick={handleMarkNotificationsRead} type="button">
                  Mark all read
                </button>
              </div>
              <div className="mini-list">
                {notifications.length ? (
                  notifications.map((item) => {
                    const href = notificationActionHref(item);
                    const row = (
                      <>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.message}</span>
                          {href ? <span className="notification-action-hint">Open auction details →</span> : null}
                        </div>
                        {!item.is_read ? <span className="status-pill warning">new</span> : <span className="soft-badge">read</span>}
                      </>
                    );
                    return href ? (
                      <Link className="mini-row notification-link-row" href={href} key={item.id} onClick={() => setShowNotifications(false)}>
                        {row}
                      </Link>
                    ) : (
                      <div className="mini-row" key={item.id}>
                        {row}
                      </div>
                    );
                  })
                ) : (
                  <span className="muted-copy">No notifications yet.</span>
                )}
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </UserAppContext.Provider>
  );
}

export function UserOverviewPage() {
  const { ownedAuctions, liveAuctions, wonAuctions, loadingWorkspace, profile, stores, wallet, currency, unreadCount } = useUserApp();

  if (loadingWorkspace || !profile || !wallet) {
    return <LoadingState title="Loading overview" copy="Fetching profile, wallet, and auction activity." />;
  }

  const pendingCount = ownedAuctions.filter((s) => s.auction_status === "pending_review").length;
  const approvedCount = ownedAuctions.filter((s) => s.auction_status === "approved").length;

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <article className="surface-card stat-row">
          <p className="section-kicker">Wallet</p>
          <strong>{currency(wallet.remainingBalance)}</strong>
          <span className="muted-copy">For auction payments and settlements.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Auction stores</p>
          <strong>{stores.length}</strong>
          <span className="muted-copy">Pickup locations in the network.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">In review</p>
          <strong>{pendingCount}</strong>
          <span className="muted-copy">Requests waiting up to 48 hours.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Live near you</p>
          <strong>{liveAuctions.length}</strong>
          <span className="muted-copy">Auctions you can join now.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Ready to start</p>
          <strong>{approvedCount}</strong>
          <span className="muted-copy">Approved slots — 6h window to go live.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Auctions won</p>
          <strong>{wonAuctions.length}</strong>
          <span className="muted-copy">
            {wonAuctions.length ? (
              <Link href="/openAuction?tab=won">View pickup & payment details</Link>
            ) : (
              "Winning bids appear in the Won tab."
            )}
          </span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Notifications</p>
          <strong>{unreadCount}</strong>
          <span className="muted-copy">Unread updates on your requests.</span>
        </article>
      </section>

      <section className="cards-grid two-up">
        <article className="section-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Your requests</p>
              <h3>Recent auction submissions</h3>
            </div>
            <Link className="soft-badge" href="/openAuction">
              Open hub
            </Link>
          </div>
          <div className="timeline-list">
            {ownedAuctions.slice(0, 5).map((slot) => (
              <div className="timeline-row" key={`owned-overview-${slot.id}`}>
                <div className="timeline-marker" />
                <div className="timeline-content">
                  <div className="timeline-top">
                    <strong>
                      #{slot.id} {slot.bike_make} {slot.bike_model}
                    </strong>
                    <span className="status-pill warning">{slot.auction_status}</span>
                  </div>
                  <p>{slot.city}</p>
                </div>
              </div>
            ))}
            {!ownedAuctions.length ? <p className="muted-copy">No auction requests yet.</p> : null}
          </div>
        </article>

        <article className="section-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Account</p>
              <h3>{profile.name}</h3>
            </div>
          </div>
          <InfoGrid>
            <InfoTile label="Email" value={profile.email} />
            <InfoTile label="Phone" value={profile.phoneNumber || "Add phone number"} />
            <InfoTile label="Address" value={profile.address || "Add address"} />
            <InfoTile label="Languages" value={profile.languages || "Not set"} />
          </InfoGrid>
        </article>
      </section>
    </div>
  );
}

export function UserWalletPage() {
  const { currency, ownedAuctions, loadingWorkspace, session, setActionMessage, setWallet, wallet } = useUserApp();
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [payment, setPayment] = useState({
    method: "card",
    holder: "",
    cardNo: "",
    expiry: "",
    cvv: "",
  });
  const [submittingRecharge, setSubmittingRecharge] = useState(false);

  if (loadingWorkspace || !wallet) {
    return <LoadingState title="Loading wallet" copy="Checking balance for auction payments." />;
  }

  function handleOpenPayment() {
    const parsedAmount = Number(rechargeAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setActionMessage({ type: "error", title: "Invalid amount", text: "Enter a valid recharge amount greater than zero." });
      return;
    }
    setShowPaymentDialog(true);
  }

  async function handleRecharge() {
    const parsedAmount = Number(rechargeAmount);
    if (!payment.holder.trim() || payment.cardNo.trim().length < 12 || payment.expiry.trim().length < 4 || payment.cvv.trim().length < 3) {
      setActionMessage({ type: "error", title: "Payment details required", text: "Fill in your card or payment details before confirming." });
      return;
    }
    try {
      setSubmittingRecharge(true);
      const updatedWallet = await rechargeWallet(session.user_id, parsedAmount);
      setWallet(updatedWallet);
      setRechargeAmount("");
      setPayment({ method: "card", holder: "", cardNo: "", expiry: "", cvv: "" });
      setShowPaymentDialog(false);
      setActionMessage({
        type: "success",
        title: "Wallet recharged",
        text: "Your wallet balance was updated successfully.",
      });
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Failed to recharge wallet." });
    } finally {
      setSubmittingRecharge(false);
    }
  }

  return (
    <div className="cards-grid two-up">
      <article className="section-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Balance</p>
            <h3>{currency(wallet.remainingBalance)}</h3>
          </div>
        </div>
        <p className="support-copy">
          Wallet funds support auction deposits, bids, and settlement payments. You need enough balance for the first bid
          deposit plus platform fee — recharge here if you see a &quot;Recharge your wallet&quot; prompt on auctions.
        </p>
        <div className="quick-actions">
          <input
            className="inline-input"
            min="1"
            onChange={(event) => setRechargeAmount(event.target.value)}
            placeholder="Amount"
            type="number"
            value={rechargeAmount}
          />
          <button className="primary-button" disabled={submittingRecharge} onClick={handleOpenPayment} type="button">
            Make payment
          </button>
          <button className="secondary-button" type="button">
            Export statement
          </button>
        </div>
      </article>

      <article className="section-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Auction activity</p>
            <h3>Your slots</h3>
          </div>
        </div>
        <div className="mini-list">
          {ownedAuctions.slice(0, 6).map((slot) => (
            <div className="mini-row" key={`wallet-slot-${slot.id}`}>
              <div>
                <strong>
                  #{slot.id} {slot.bike_make}
                </strong>
                <span>{slot.auction_status}</span>
              </div>
              <b>{currency(slot.lowest_prize)}</b>
            </div>
          ))}
          {!ownedAuctions.length ? <span className="muted-copy">No auction requests linked yet.</span> : null}
        </div>
      </article>
      <PaymentDialog
        open={showPaymentDialog}
        amount={currency(rechargeAmount || 0)}
        onClose={() => setShowPaymentDialog(false)}
        onSubmit={handleRecharge}
        submitting={submittingRecharge}
        payment={payment}
        setPayment={setPayment}
      />
    </div>
  );
}

export function UserActivityPage() {
  const { activityItems, loadingWorkspace } = useUserApp();
  if (loadingWorkspace) {
    return <LoadingState title="Loading activity" copy="Preparing your latest events and updates." />;
  }
  return (
    <div className="section-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Activity stream</p>
          <h3>Recent events</h3>
        </div>
      </div>
      <div className="timeline-list">
        {activityItems.length ? (
          activityItems.map((item) => (
            <div className="timeline-row" key={item.id}>
              <div className="timeline-marker" />
              <div className="timeline-content">
                <div className="timeline-top">
                  <strong>{item.title}</strong>
                  <span className={`status-pill ${item.is_read ? "success" : "warning"}`}>{item.is_read ? "read" : "new"}</span>
                </div>
                <p>{item.message}</p>
                <small>{formatDate(item.created_at)}</small>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="No activity yet" copy="Events appear here as you use auctions and your account." />
        )}
      </div>
    </div>
  );
}

export function UserProfilePage() {
  const { loadingWorkspace, profile, session, setProfile, setActionMessage } = useUserApp();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    nationality: "",
    languages: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || "",
      phoneNumber: profile.phoneNumber || "",
      address: profile.address || "",
      nationality: profile.nationality || "",
      languages: profile.languages || "",
      facebook: profile.socialLinks?.facebook || "",
      instagram: profile.socialLinks?.instagram || "",
      linkedin: profile.socialLinks?.linkedin || "",
      youtube: profile.socialLinks?.youtube || "",
    });
  }, [profile]);

  if (loadingWorkspace || !profile) {
    return <LoadingState title="Loading profile" copy="Preparing your profile and awards." />;
  }

  async function handleSave(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      const updated = await updateUserProfile(session.user_id, {
        name: form.name,
        phoneNumber: form.phoneNumber,
        address: form.address,
        nationality: form.nationality,
        languages: form.languages,
        socialLinks: {
          facebook: form.facebook,
          instagram: form.instagram,
          linkedin: form.linkedin,
          youtube: form.youtube,
        },
      });
      setProfile(updated);
      setEditing(false);
      setActionMessage({
        type: "success",
        title: "Profile updated",
        text: "Your profile details were saved successfully.",
      });
    } catch (error) {
      setActionMessage({ type: "error", title: "Save failed", text: error.message || "Could not update profile." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-grid">
      <section className="section-card profile-editor-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Profile</p>
            <h3>{profile.name}</h3>
          </div>
          {!editing ? (
            <button className="primary-button" onClick={() => setEditing(true)} type="button">
              Edit profile
            </button>
          ) : null}
        </div>

        {editing ? (
          <form className="form-grid profile-form" onSubmit={handleSave}>
            <label>
              Full name
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />
            </label>
            <label>
              Email
              <input value={profile.email} disabled readOnly />
            </label>
            <label>
              Phone
              <input value={form.phoneNumber} onChange={(e) => setForm((c) => ({ ...c, phoneNumber: e.target.value }))} />
            </label>
            <label className="full-span">
              Address
              <input value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} />
            </label>
            <label>
              Nationality
              <input value={form.nationality} onChange={(e) => setForm((c) => ({ ...c, nationality: e.target.value }))} />
            </label>
            <label>
              Languages
              <input value={form.languages} onChange={(e) => setForm((c) => ({ ...c, languages: e.target.value }))} />
            </label>
            <label>
              Facebook
              <input value={form.facebook} onChange={(e) => setForm((c) => ({ ...c, facebook: e.target.value }))} />
            </label>
            <label>
              Instagram
              <input value={form.instagram} onChange={(e) => setForm((c) => ({ ...c, instagram: e.target.value }))} />
            </label>
            <label>
              LinkedIn
              <input value={form.linkedin} onChange={(e) => setForm((c) => ({ ...c, linkedin: e.target.value }))} />
            </label>
            <label>
              YouTube
              <input value={form.youtube} onChange={(e) => setForm((c) => ({ ...c, youtube: e.target.value }))} />
            </label>
            <div className="full-span quick-actions">
              <button className="secondary-button" onClick={() => setEditing(false)} type="button">
                Cancel
              </button>
              <button className="primary-button" disabled={submitting} type="submit">
                {submitting ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        ) : (
          <InfoGrid>
            <InfoTile label="Email" value={profile.email} />
            <InfoTile label="Phone" value={profile.phoneNumber || "Add phone number"} />
            <InfoTile label="Address" value={profile.address || "Add address"} />
            <InfoTile label="Nationality" value={profile.nationality || "Not set"} />
            <InfoTile label="Languages" value={profile.languages || "Not set"} />
            <InfoTile
              label="Social"
              value={profile.socialLinks?.instagram || profile.socialLinks?.facebook || "No links yet"}
            />
          </InfoGrid>
        )}
      </section>

      <section className="section-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">Awards</p>
            <h3>Recognition</h3>
          </div>
        </div>
        {profile.awards?.length ? (
          <div className="mini-list">
            {profile.awards.map((award) => (
              <div className="mini-row" key={award.title}>
                <div>
                  <strong>{award.title}</strong>
                  <span>{award.description}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No awards yet" copy="Awards and achievements will appear here when they are added." />
        )}
      </section>
    </div>
  );
}

export function UserSettingsPage() {
  const { session, setActionMessage } = useUserApp();
  const [issueForm, setIssueForm] = useState({ title: "", description: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  async function handleIssueSubmit(event) {
    event.preventDefault();
    if (!issueForm.title.trim() || !issueForm.description.trim()) {
      setActionMessage({ type: "error", title: "Missing fields", text: "Issue title and description are both required." });
      return;
    }

    try {
      setSubmittingIssue(true);
      await submitIssue({
        user_id: session.user_id,
        title: issueForm.title.trim(),
        description: issueForm.description.trim(),
      });
      setIssueForm({ title: "", description: "" });
      setActionMessage({ type: "success", title: "Issue submitted", text: "Your support issue was sent to the admin team." });
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Failed to submit issue." });
    } finally {
      setSubmittingIssue(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setActionMessage({ type: "error", title: "Missing fields", text: "Fill in all password fields before saving." });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setActionMessage({ type: "error", title: "Passwords do not match", text: "New password and confirm password must be the same." });
      return;
    }

    try {
      setSubmittingPassword(true);
      await updateUserPassword(session.user_id, {
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      });
      setPasswordForm({ current: "", next: "", confirm: "" });
      setActionMessage({ type: "success", title: "Password updated", text: "Your account password was changed successfully." });
    } catch (error) {
      setActionMessage({ type: "error", text: error.message || "Failed to update password." });
    } finally {
      setSubmittingPassword(false);
    }
  }

  return (
    <div className="section-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Settings</p>
          <h3>Security and support</h3>
        </div>
      </div>
      <div className="settings-list">
        <article className="settings-form-card">
          <span>Password</span>
          <strong>Change account password</strong>
          <form className="stack-form" onSubmit={handlePasswordSubmit}>
            <input
              onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))}
              placeholder="Current password"
              type="password"
              value={passwordForm.current}
            />
            <input
              onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))}
              placeholder="New password"
              type="password"
              value={passwordForm.next}
            />
            <input
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))}
              placeholder="Confirm new password"
              type="password"
              value={passwordForm.confirm}
            />
            <button className="primary-button" disabled={submittingPassword} type="submit">
              {submittingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </article>
        <article className="settings-form-card">
          <span>Support</span>
          <strong>Report auction, wallet, or account issues</strong>
          <form className="stack-form" onSubmit={handleIssueSubmit}>
            <input
              onChange={(event) => setIssueForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Issue title"
              type="text"
              value={issueForm.title}
            />
            <textarea
              onChange={(event) => setIssueForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe your issue"
              rows={4}
              value={issueForm.description}
            />
            <button className="secondary-button" disabled={submittingIssue} type="submit">
              {submittingIssue ? "Submitting..." : "Submit issue"}
            </button>
          </form>
        </article>
        <article>
          <span>Account</span>
          <strong>Delete or archive account</strong>
          <p className="muted-copy">Sensitive actions are being kept separate while the backend migration settles down.</p>
        </article>
      </div>
    </div>
  );
}
