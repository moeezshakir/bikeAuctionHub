"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HiBell, HiChartBarSquare, HiCog6Tooth, HiDocumentText, HiExclamationTriangle, HiMapPin, HiRectangleGroup, HiTicket, HiTrash, HiWallet } from "react-icons/hi2";
import { toMessagePayload, useAppMessage } from "@/components/ridehub/AppMessageBox";
import { clearStoredSession, readStoredSession, ADMIN_SESSION_KEY } from "@/lib/session";
import {
  auctionAction,
  deactivateAuctionCategory,
  deleteAuctionData,
  getAdminActivity,
  getAuctionCategories,
  getAuctionSlots,
  getAuctionSlotsByFilter,
  getNotifications,
  getPlatformSettings,
  getSuccessfulAuctions,
  markNotificationsRead,
  getReportedIssues,
  getStores,
  updateIssueStatus,
  updatePlatformSettings,
  createStore,
  createAuctionCategory,
} from "@/lib/legacyApi";
import { AuctionGallery } from "@/components/ridehub/AuctionGallery";
import { AuctionRequestFieldsEditor, buildRequestFieldsFormState } from "@/components/ridehub/AuctionRequestFieldsEditor";
import { PaymentBankAccountsEditor } from "@/components/ridehub/PaymentBankAccountsEditor";
import { buildPaymentBankAccountsFormState } from "@/lib/paymentBankAccounts";
import { ConfirmDialog, PromptDialog } from "@/components/ridehub/AppDialog";
import { auctionStatusLabel, auctionStatusPillClass, outcomeStatusPillClass } from "@/lib/auctionStatusDisplay";

const AdminAppContext = createContext(null);

const navItems = [
  { href: "/admin/admin-home", label: "Overview", note: "Operational summary", icon: HiRectangleGroup },
  { href: "/admin/auctionProcess", label: "Auctions", note: "Review queue and settlements", icon: HiTicket },
  { href: "/admin/stores", label: "Stores", note: "Stores, categories, platform fee", icon: HiMapPin },
  { href: "/admin/reportedIssues", label: "Issues", note: "Customer reports", icon: HiExclamationTriangle },
  { href: "/admin/activity", label: "Activity", note: "System events timeline", icon: HiChartBarSquare },
];

const titles = {
  "/admin/admin-home": {
    title: "Operations overview",
    note: "A cleaner admin home with fleet, issue, and auction context in one place.",
  },
  "/admin/auctionProcess": {
    title: "Auction operations",
    note: "Review requests, track Status 1 (lifecycle) and Status 2 (outcome), and confirm settlements.",
  },
  "/admin/stores": {
    title: "Stores & platform",
    note: "Manage pickup stores, auction categories, and deductible platform fee (1–8%).",
  },
  "/admin/reportedIssues": {
    title: "Issue desk",
    note: "Keep rider reports and service notes inside one review surface.",
  },
  "/admin/activity": {
    title: "Activity",
    note: "Track auction and ride operational events in one feed.",
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
    return "Not available";
  }
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return String(value);
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

function AdminAuctionStatusBadge({ status }) {
  return <span className={`status-pill ${auctionStatusPillClass(status)}`}>{auctionStatusLabel(status)}</span>;
}

function AdminOutcomeStatusBadge({ slot }) {
  return (
    <span className={`status-pill ${outcomeStatusPillClass(slot.outcome_status)}`} title={slot.outcome_detail || ""}>
      {slot.outcome_label || "—"}
    </span>
  );
}

function AdminSettlementSteps({ slot }) {
  if (slot.auction_status !== "completed") {
    return <span className="muted-copy">—</span>;
  }

  return (
    <div className="admin-settlement-steps">
      <span className={slot.payment_forms?.userPaid?.confirmed ? "status-pill success" : "status-pill warning"}>Buyer paid</span>
      <span className={slot.payment_forms?.counterpartyCredited?.confirmed ? "status-pill success" : "status-pill warning"}>
        Seller credited
      </span>
      <span className={slot.payment_forms?.adminConfirmed?.confirmed ? "status-pill success" : "status-pill warning"}>Admin OK</span>
    </div>
  );
}

function formatSlotMoney(value, slotCurrency = "PKR") {
  const code = slotCurrency === "PKR" ? "PKR" : slotCurrency;
  try {
    return new Intl.NumberFormat(code === "PKR" ? "en-PK" : "en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${slotCurrency} ${Number(value || 0).toLocaleString()}`;
  }
}

function AdminAuctionStatusRow({ slot, onAdminSettlement, showActions = true }) {
  return (
    <div className="table-row admin-status-row">
      <div className="admin-status-main">
        <strong>
          #{slot.id} {slot.item_title || `${slot.bike_make} ${slot.bike_model}`}
        </strong>
        <span>
          Owner #{slot.user_id}
          {slot.winner_user_id ? ` · Winner #${slot.winner_user_id}` : ""} · {slot.city}
          {slot.store_name ? ` · ${slot.store_name}` : ""}
        </span>
        {slot.outcome_detail ? <small className="admin-outcome-detail">{slot.outcome_detail}</small> : null}
        {slot.stop_reason && slot.auction_status === "stopped" ? (
          <small className="admin-outcome-detail">Reason: {slot.stop_reason}</small>
        ) : null}
      </div>
      <div className="admin-status-columns">
        <div className="admin-status-col">
          <span className="admin-status-col-label">Status 1</span>
          <AdminAuctionStatusBadge status={slot.auction_status} />
        </div>
        <div className="admin-status-col">
          <span className="admin-status-col-label">Status 2</span>
          <AdminOutcomeStatusBadge slot={slot} />
        </div>
      </div>
      <div className="admin-status-settlement">
        <AdminSettlementSteps slot={slot} />
      </div>
      {showActions && slot.auction_status === "completed" && !slot.is_fully_closed ? (
        <div className="admin-settlement-actions">
          {!slot.payment_forms?.userPaid?.confirmed ? (
            <span className="muted-copy">Waiting for winner payment</span>
          ) : null}
          {slot.payment_forms?.userPaid?.confirmed && !slot.payment_forms?.counterpartyCredited?.confirmed ? (
            <button className="primary-button" onClick={() => onAdminSettlement(slot, "counterparty_credited")} type="button">
              Credit seller {formatSlotMoney(slot.seller_credit_amount, slot.currency)}
            </button>
          ) : null}
          {slot.payment_forms?.counterpartyCredited?.confirmed && !slot.payment_forms?.adminConfirmed?.confirmed ? (
            <button className="secondary-button" onClick={() => onAdminSettlement(slot, "admin_confirmed")} type="button">
              Final confirm
            </button>
          ) : null}
        </div>
      ) : showActions && slot.is_fully_closed ? (
        <div>
          <span className="status-pill success">Closed ✓</span>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

function useAdminApp() {
  const context = useContext(AdminAppContext);

  if (!context) {
    throw new Error("useAdminApp must be used inside AdminAppLayout");
  }

  return context;
}

export function AdminAppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showMessage } = useAppMessage();
  const isPublicAdminRoute = pathname === "/admin/admin-signin";
  const [session, setSession] = useState(undefined);
  const [stores, setStores] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [completedAuctions, setCompletedAuctions] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activityItems, setActivityItems] = useState([]);

  useEffect(() => {
    if (isPublicAdminRoute) {
      setSession(null);
      return;
    }

    const stored = readStoredSession(ADMIN_SESSION_KEY);
    setSession(stored || null);
    if (!stored) {
      router.replace("/admin/admin-signin");
    }
  }, [isPublicAdminRoute, router]);

  useEffect(() => {
    if (isPublicAdminRoute || !session?.store_id) {
      return;
    }

    let ignore = false;

    async function loadWorkspace() {
      setLoadingWorkspace(true);

      try {
        const [storeData, auctionData, issueData, successData] = await Promise.all([
          getStores(),
          getAuctionSlotsByFilter({ status: "pending" }),
          getReportedIssues(),
          getSuccessfulAuctions(),
        ]);

        if (ignore) {
          return;
        }

        setStores(storeData);
        setAuctions(auctionData);
        setIssues(issueData);
        setCompletedAuctions(successData);
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
  }, [isPublicAdminRoute, session?.store_id]);

  useEffect(() => {
    if (isPublicAdminRoute || !session?.store_id) return;
    let ignore = false;
    async function loadAdminSignals() {
      const [notificationData, activityData] = await Promise.all([
        getNotifications({ role: "admin", storeId: session.store_id, limit: 12 }),
        getAdminActivity(session.store_id),
      ]);
      if (ignore) return;
      setNotifications(notificationData.data || []);
      setUnreadCount(notificationData.unreadCount || 0);
      setActivityItems(activityData || []);
    }
    loadAdminSignals();
    const timer = setInterval(loadAdminSignals, 15000);
    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [isPublicAdminRoute, session?.store_id]);

  const setAdminMessage = useCallback(
    (payload) => {
      showMessage(toMessagePayload(payload));
    },
    [showMessage]
  );

  const contextValue = useMemo(
    () => ({
      session,
      stores,
      auctions,
      completedAuctions,
      issues,
      loadingWorkspace,
      setAuctions,
      setCompletedAuctions,
      setIssues,
      setStores,
      setAdminMessage,
      notifications,
      unreadCount,
      showNotifications,
      setShowNotifications,
      activityItems,
    }),
    [session, stores, auctions, completedAuctions, issues, loadingWorkspace, setAdminMessage, notifications, unreadCount, showNotifications, activityItems]
  );

  function handleLogout() {
    clearStoredSession(ADMIN_SESSION_KEY);
    router.push("/admin/admin-signin");
  }

  if (isPublicAdminRoute) {
    return children;
  }

  if (session === undefined) {
    return <LoadingState title="Preparing admin workspace" copy="Checking your local admin session." />;
  }

  if (session === null) {
    return null;
  }

  const heading = titles[pathname] || titles["/admin/admin-home"];

  async function handleMarkNotificationsRead() {
    if (!session?.store_id || !unreadCount) return;
    await markNotificationsRead({
      role: "admin",
      storeId: session.store_id,
      markAll: true,
    });
    setUnreadCount(0);
    setNotifications((current) => current.map((entry) => ({ ...entry, is_read: true })));
  }

  return (
    <AdminAppContext.Provider value={contextValue}>
      <div className="app-shell admin-mode">
        <aside className="sidebar-shell">
          <div className="brand-block">
            <div className="brand-badge">AD</div>
            <div className="brand-copy">
              <h2>{process.env.NEXT_PUBLIC_APP_NAME || "Bike Auction Hub"} Admin</h2>
              <p>Operations desk</p>
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
              <strong>{session.email}</strong>
              <span>Store #{session.store_id}</span>
            </div>
            <button className="secondary-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <div className="content-shell">
          <header className="topbar">
            <div className="content-head">
              <p className="section-kicker">Admin workspace</p>
              <h2>{heading.title}</h2>
              <p>{heading.note}</p>
            </div>
            <div className="topbar-actions">
              <button className="secondary-button notification-button" onClick={() => setShowNotifications((current) => !current)} type="button">
                {HiBell ? <HiBell className="button-icon" /> : null}
                Notifications
                {unreadCount ? <span className="notif-badge notif-dot">{unreadCount}</span> : null}
              </button>
            </div>
          </header>
          {showNotifications ? (
            <div className="section-card notification-panel">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Notification center</p>
                  <h3>Admin updates</h3>
                </div>
                <button className="secondary-button" onClick={handleMarkNotificationsRead} type="button">
                  Mark all read
                </button>
              </div>
              <div className="mini-list">
                {notifications.length ? (
                  notifications.map((item) => (
                    <div className="mini-row" key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.message}</span>
                      </div>
                      {!item.is_read ? <span className="status-pill warning">new</span> : <span className="soft-badge">read</span>}
                    </div>
                  ))
                ) : (
                  <span className="muted-copy">No notifications yet.</span>
                )}
              </div>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </AdminAppContext.Provider>
  );
}

export function AdminOverviewPage() {
  const { auctions, completedAuctions, issues, loadingWorkspace, stores } = useAdminApp();

  if (loadingWorkspace) {
    return <LoadingState title="Loading admin overview" copy="Pulling auction queue, issues, and store network." />;
  }

  const paidClosedCount = completedAuctions.filter((slot) => slot.is_fully_closed || slot.outcome_status === "paid_closed").length;
  const settlementPendingCount = completedAuctions.filter(
    (slot) => slot.auction_status === "completed" && !slot.is_fully_closed && slot.outcome_status !== "paid_closed"
  ).length;

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <article className="surface-card stat-row">
          <p className="section-kicker">Auction stores</p>
          <strong>{stores.length}</strong>
          <span className="muted-copy">Pickup locations in the network.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Review queue</p>
          <strong>{auctions.length}</strong>
          <span className="muted-copy">Requests waiting for inspection (up to 48h).</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Completed</p>
          <strong>{completedAuctions.length}</strong>
          <span className="muted-copy">Sold auctions with settlement tracking.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Paid & closed</p>
          <strong>{paidClosedCount}</strong>
          <span className="muted-copy">Status 2: fully settled and closed.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Settlement pending</p>
          <strong>{settlementPendingCount}</strong>
          <span className="muted-copy">Sold but payment steps still open.</span>
        </article>
        <article className="surface-card stat-row">
          <p className="section-kicker">Open issues</p>
          <strong>{issues.length}</strong>
          <span className="muted-copy">Customer reports awaiting review.</span>
        </article>
      </section>

      <section className="admin-hero">
        <article className="section-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Review queue</p>
              <h3>Pending auction requests</h3>
            </div>
          </div>
          <div className="mini-list">
            {auctions.length ? (
              auctions.slice(0, 5).map((slot) => (
                <div className="mini-row" key={slot.id}>
                  <div>
                    <strong>
                      #{slot.id} {slot.bike_make} {slot.bike_model}
                    </strong>
                    <span>User #{slot.user_id}</span>
                  </div>
                  <div className="admin-mini-statuses">
                    <AdminAuctionStatusBadge status={slot.auction_status} />
                    <AdminOutcomeStatusBadge slot={slot} />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted-copy">No pending auction requests.</p>
            )}
          </div>
        </article>

        <article className="section-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Latest issues</p>
              <h3>Desk queue</h3>
            </div>
          </div>
          <div className="issue-list">
            {issues.length ? (
              issues.slice(0, 4).map((issue, index) => (
                <div className="issue-row" key={issue.id || `${issue.user_id}-${index}`}>
                  <div>
                    <strong>{issue.title}</strong>
                    <span>{issue.description}</span>
                  </div>
                  <span className={`status-pill ${issue.status === "resolved" ? "success" : "warning"}`}>
                    {issue.status || "open"}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted-copy">No active issue tickets right now.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export function AdminAuctionsPage() {
  const { auctions, completedAuctions, loadingWorkspace, setAdminMessage, setAuctions, setCompletedAuctions } = useAdminApp();
  const [tab, setTab] = useState("queue");
  const [statusFilter, setStatusFilter] = useState("all");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [allAuctions, setAllAuctions] = useState([]);
  const [loadingAllAuctions, setLoadingAllAuctions] = useState(false);
  const [selectedAuctionId, setSelectedAuctionId] = useState("");
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);
  const [promptNote, setPromptNote] = useState("");
  const [dialogBusy, setDialogBusy] = useState(false);

  const selectedAuction = useMemo(
    () => allAuctions.find((entry) => String(entry.id) === String(selectedAuctionId)) || null,
    [allAuctions, selectedAuctionId]
  );

  useEffect(() => {
    if (tab !== "clear" && tab !== "status") return;
    let ignore = false;
    async function loadAll() {
      setLoadingAllAuctions(true);
      try {
        const data = await getAuctionSlots();
        if (!ignore) {
          setAllAuctions(data);
          if (tab === "clear") {
            setSelectedAuctionId((current) => current || (data[0]?.id ? String(data[0].id) : ""));
          }
        }
      } finally {
        if (!ignore) setLoadingAllAuctions(false);
      }
    }
    loadAll();
    return () => {
      ignore = true;
    };
  }, [tab]);

  const filteredStatusAuctions = useMemo(() => {
    if (statusFilter === "all") return allAuctions;
    if (statusFilter === "paid_closed") {
      return allAuctions.filter((slot) => slot.is_fully_closed || slot.outcome_status === "paid_closed");
    }
    if (statusFilter === "settlement_pending") {
      return allAuctions.filter((slot) => slot.auction_status === "completed" && !slot.is_fully_closed);
    }
    return allAuctions.filter((slot) => slot.auction_status === statusFilter || slot.outcome_status === statusFilter);
  }, [allAuctions, statusFilter]);

  if (loadingWorkspace) {
    return <LoadingState title="Loading auctions" copy="Pulling review queue and successful auctions." />;
  }

  async function handleReview(slot, action) {
    try {
      setSubmittingAction(true);
      await auctionAction({
        auction_id: slot.id,
        user_id: slot.user_id,
        action,
      });
      setAuctions((current) => current.filter((entry) => entry.id !== slot.id));
      setAdminMessage({
        type: "success",
        title: action === "accept" ? "Request approved" : "Request rejected",
        text: `Auction #${slot.id} was ${action === "accept" ? "approved" : "rejected"}. The user has been notified.`,
      });
    } catch (error) {
      setAdminMessage({ type: "error", text: error.message || "Failed to update auction status." });
    } finally {
      setSubmittingAction(false);
    }
  }

  async function executeAdminSettlement(slot, formType, note) {
    const formKeyMap = {
      counterparty_credited: "counterpartyCredited",
      admin_confirmed: "adminConfirmed",
    };
    const formKey = formKeyMap[formType];

    try {
      setDialogBusy(true);
      const result = await auctionAction({
        auction_id: slot.id,
        user_id: 0,
        action: "settlement",
        form_type: formType,
        note,
      });

      const applyUpdate = (entry) => {
        if (entry.id !== slot.id) return entry;
        const payment_forms = {
          ...entry.payment_forms,
          [formKey]: {
            confirmed: true,
            note,
            ...(result?.wallet_credit
              ? {
                  creditAmount: result.wallet_credit.creditAmount,
                  walletBalanceAfter: result.wallet_credit.walletBalance,
                }
              : {}),
          },
        };
        const fullyClosed =
          payment_forms.userPaid?.confirmed &&
          payment_forms.counterpartyCredited?.confirmed &&
          payment_forms.adminConfirmed?.confirmed;
        return {
          ...entry,
          payment_forms,
          is_fully_closed: fullyClosed,
          outcome_status: fullyClosed ? "paid_closed" : "settlement_pending",
          outcome_label: fullyClosed ? "Paid & fully closed" : "Settlement in progress",
          outcome_detail: fullyClosed ? "All payment steps confirmed" : entry.outcome_detail,
        };
      };

      setCompletedAuctions((current) => current.map(applyUpdate));
      setAllAuctions((current) => current.map(applyUpdate));
      setAdminMessage({
        type: "success",
        title: formType === "counterparty_credited" ? "Seller credited" : "Settlement saved",
        text:
          result?.message ||
          (formType === "counterparty_credited"
            ? "Seller wallet was credited. Tap Final confirm when ready to close the auction."
            : "Admin settlement form was recorded."),
      });
    } catch (error) {
      setAdminMessage({ type: "error", text: error.message || "Failed to save settlement." });
    } finally {
      setDialogBusy(false);
      setPromptDialog(null);
      setPromptNote("");
    }
  }

  function handleAdminSettlement(slot, formType) {
    setPromptNote("");
    setPromptDialog({ slot, formType });
  }

  async function handleAdminPromptConfirm() {
    if (!promptDialog) return;
    await executeAdminSettlement(promptDialog.slot, promptDialog.formType, promptNote.trim());
  }

  async function executePurgeAuction() {
    const deletedId = Number(selectedAuctionId);
    try {
      setSubmittingAction(true);
      setDialogBusy(true);
      const result = await deleteAuctionData(deletedId, purgeConfirm);
      setAllAuctions((current) => current.filter((entry) => entry.id !== deletedId));
      setAuctions((current) => current.filter((entry) => entry.id !== deletedId));
      setCompletedAuctions((current) => current.filter((entry) => entry.id !== deletedId));
      setSelectedAuctionId("");
      setPurgeConfirm("");
      setAdminMessage({
        type: "success",
        title: "Auction data deleted",
        text: result.message || `Auction #${deletedId} was removed from the database.`,
      });
    } catch (error) {
      setAdminMessage({ type: "error", title: "Delete failed", text: error.message || "Could not delete auction data." });
    } finally {
      setSubmittingAction(false);
      setDialogBusy(false);
      setConfirmDialog(null);
    }
  }

  function handlePurgeAuction() {
    if (!selectedAuctionId) {
      setAdminMessage({ type: "error", title: "No auction selected", text: "Choose an auction to delete from the list." });
      return;
    }
    if (purgeConfirm.trim().toUpperCase() !== "DELETE") {
      setAdminMessage({
        type: "warning",
        title: "Confirmation required",
        text: 'Type DELETE in the confirmation box to permanently remove this auction.',
      });
      return;
    }
    setConfirmDialog({
      variant: "danger",
      title: "Delete auction permanently?",
      message: `Auction #${selectedAuctionId} and all bids, deposits, status rows, and related notifications will be removed from the database. This cannot be undone.`,
      confirmLabel: "Delete forever",
      onConfirm: executePurgeAuction,
    });
  }

  return (
    <div className="auction-hub">
      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel={confirmDialog?.confirmLabel}
        loading={dialogBusy}
        message={confirmDialog?.message}
        onCancel={() => !dialogBusy && setConfirmDialog(null)}
        onConfirm={() => confirmDialog?.onConfirm?.()}
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        variant={confirmDialog?.variant || "warning"}
      />
      <PromptDialog
        cancelLabel="Cancel"
        confirmLabel={promptDialog?.formType === "counterparty_credited" ? "Credit seller wallet" : "Save confirmation"}
        loading={dialogBusy}
        message={
          promptDialog?.formType === "counterparty_credited"
            ? `Verify the winner's bank transfer, then credit seller #${promptDialog?.slot?.user_id} with ${formatSlotMoney(promptDialog?.slot?.seller_credit_amount, promptDialog?.slot?.currency)}. Optional note:`
            : "Add an optional admin note for final settlement confirmation."
        }
        onCancel={() => !dialogBusy && setPromptDialog(null)}
        onChange={setPromptNote}
        onConfirm={handleAdminPromptConfirm}
        open={Boolean(promptDialog)}
        title={promptDialog?.formType === "counterparty_credited" ? "Credit seller wallet" : "Final settlement confirm"}
        value={promptNote}
      />
      <div className="mode-switch">
        <button className={tab === "queue" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("queue")} type="button">
          Review queue ({auctions.length})
        </button>
        <button className={tab === "success" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("success")} type="button">
          Successful ({completedAuctions.length})
        </button>
        <button className={tab === "status" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("status")} type="button">
          All status
        </button>
        <button className={tab === "clear" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("clear")} type="button">
          <HiTrash /> Clear data
        </button>
      </div>

      {tab === "queue" ? (
        auctions.length ? (
          <div className="auction-grid">
            {auctions.map((slot) => (
              <article className="auction-card inspect-card" key={slot.id}>
                <p className="section-kicker">
                  #{slot.id} · {slot.city} · {slot.store_name} · {slot.currency || "PKR"}
                </p>
                <h3>
                  {slot.item_title || `${slot.bike_make} ${slot.bike_model}`} ({slot.bike_year})
                </h3>
                <p className="muted-copy">
                  {slot.category_name ? `${slot.category_name} · ` : ""}
                  Owner: {slot.username} · CNIC {slot.cnic_number} · Registered on CNIC:{" "}
                  {slot.registered_on_cnic ? "Yes" : "No"}
                </p>
                <p>
                  Range {currency(slot.lowest_prize)} – {currency(slot.highest_prize)}
                </p>
                <AuctionGallery label={`Review auction #${slot.id}`} size="large" slot={slot} />
                {slot.cnic_image ? (
                  <p className="muted-copy">
                    CNIC on file:{" "}
                    <a href={`/${slot.cnic_image}`} rel="noreferrer" target="_blank">
                      Open CNIC image
                    </a>
                  </p>
                ) : null}
                <div className="auction-meta">
                  <AdminAuctionStatusBadge status={slot.auction_status} />
                  <AdminOutcomeStatusBadge slot={slot} />
                  <div className="inline-actions">
                    <button className="primary-button" disabled={submittingAction} onClick={() => handleReview(slot, "accept")} type="button">
                      Accept
                    </button>
                    <button className="secondary-button danger-outline" disabled={submittingAction} onClick={() => handleReview(slot, "reject")} type="button">
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Queue is clear" copy="New auction requests will appear here for inspection." />
        )
      ) : null}

      {tab === "clear" ? (
        <article className="section-card admin-purge-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Database cleanup</p>
              <h3>Delete auction permanently</h3>
            </div>
          </div>
          <p className="muted-copy purge-warning">
            This removes the auction slot, status, all bids, bid deposits, and related notifications from MongoDB.
            Uploaded image files on disk are not deleted. This action cannot be undone.
          </p>

          {loadingAllAuctions ? (
            <LoadingState title="Loading auctions" copy="Fetching all auction records from the database." />
          ) : allAuctions.length ? (
            <div className="form-grid purge-form">
              <label className="full-span">
                Select auction
                <select value={selectedAuctionId} onChange={(e) => setSelectedAuctionId(e.target.value)}>
                  <option value="">Choose an auction…</option>
                  {allAuctions.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      #{slot.id} · S1: {auctionStatusLabel(slot.auction_status)} · S2: {slot.outcome_label} ·{" "}
                      {slot.item_title || `${slot.bike_make} ${slot.bike_model}`}
                    </option>
                  ))}
                </select>
              </label>

              {selectedAuction ? (
                <div className="full-span purge-preview">
                  <strong>Will be deleted for auction #{selectedAuction.id}</strong>
                  <ul>
                    <li>Status 1: {auctionStatusLabel(selectedAuction.auction_status)}</li>
                    <li>Status 2: {selectedAuction.outcome_label}</li>
                    {selectedAuction.outcome_detail ? <li>Detail: {selectedAuction.outcome_detail}</li> : null}
                    <li>Owner: {selectedAuction.username} (user #{selectedAuction.user_id})</li>
                    <li>Item: {selectedAuction.item_title || `${selectedAuction.bike_make} ${selectedAuction.bike_model}`}</li>
                    <li>Bids in feed: {selectedAuction.participants?.length || 0}</li>
                    <li>Store: {selectedAuction.store_name || "—"} · {selectedAuction.city}</li>
                  </ul>
                  <AuctionGallery label={`Auction #${selectedAuction.id}`} size="large" slot={selectedAuction} />
                </div>
              ) : null}

              <label className="full-span">
                Type DELETE to confirm
                <input
                  onChange={(e) => setPurgeConfirm(e.target.value)}
                  placeholder="DELETE"
                  value={purgeConfirm}
                />
              </label>

              <div className="full-span quick-actions">
                <button
                  className="secondary-button danger-outline"
                  disabled={submittingAction || !selectedAuctionId || purgeConfirm.trim().toUpperCase() !== "DELETE"}
                  onClick={handlePurgeAuction}
                  type="button"
                >
                  {submittingAction ? "Deleting..." : "Delete auction data"}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState title="No auction data" copy="There are no auction records in the database to delete." />
          )}
        </article>
      ) : null}

      {tab === "status" ? (
        <article className="section-card admin-status-panel">
          <div className="section-head">
            <div>
              <p className="section-kicker">Auction lifecycle</p>
              <h3>Status 1 & Status 2 tracker</h3>
              <p className="muted-copy">
                Status 1 is the auction stage (queue, live, completed, stopped). Status 2 is the outcome — paid & fully closed,
                settlement pending, stopped without winner, expired, rejected, and other reasons.
              </p>
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All auctions</option>
              <option value="pending_review">Status 1: In queue</option>
              <option value="live">Status 1: Live</option>
              <option value="completed">Status 1: Completed (sold)</option>
              <option value="stopped">Status 1: Stopped</option>
              <option value="rejected">Status 1: Rejected</option>
              <option value="expired">Status 1: Expired</option>
              <option value="paid_closed">Status 2: Paid & fully closed</option>
              <option value="settlement_pending">Status 2: Settlement pending</option>
              <option value="stopped_no_winner">Status 2: Stopped — no winner</option>
              <option value="auto_stopped">Status 2: Auto-closed — no winner</option>
            </select>
          </div>

          {loadingAllAuctions ? (
            <LoadingState title="Loading auction statuses" copy="Fetching all auctions from the database." />
          ) : filteredStatusAuctions.length ? (
            <div className="table-list admin-status-table">
              <div className="table-row admin-status-head">
                <strong>Auction</strong>
                <strong>Status 1 · Status 2</strong>
                <strong>Settlement</strong>
                <strong>Action</strong>
              </div>
              {filteredStatusAuctions.map((slot) => (
                <AdminAuctionStatusRow key={`admin-status-${slot.id}`} onAdminSettlement={handleAdminSettlement} slot={slot} />
              ))}
            </div>
          ) : (
            <EmptyState title="No matching auctions" copy="Change the filter or wait for new auction activity." />
          )}
        </article>
      ) : null}

      {tab === "success" ? (
        completedAuctions.length ? (
          <div className="table-list admin-status-table">
            <div className="table-row admin-status-head">
              <strong>Auction</strong>
              <strong>Status 1 · Status 2</strong>
              <strong>Settlement</strong>
              <strong>Action</strong>
            </div>
            {completedAuctions.map((slot) => (
              <AdminAuctionStatusRow key={`done-${slot.id}`} onAdminSettlement={handleAdminSettlement} slot={slot} />
            ))}
          </div>
        ) : (
          <EmptyState title="No completed auctions" copy="Successful auctions with settlement forms appear here." />
        )
      ) : null}
    </div>
  );
}

export function AdminStoresPage() {
  const { stores, loadingWorkspace, setAdminMessage, setStores } = useAdminApp();
  const [tab, setTab] = useState("stores");
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({
    platform_fee_percent: 0.3,
    seller_fee_percent: 5,
    buyer_fee_percent: 0.3,
    bid_deposit_amount: 500,
    payment_bank_name: "",
    payment_account_title: "",
    payment_account_number: "",
    payment_iban: "",
    payment_instructions: "",
  });
  const [loading, setLoading] = useState(true);
  const [storeForm, setStoreForm] = useState({ storeName: "", city: "", address: "", latitude: "", longitude: "", status: "Open" });
  const [categoryName, setCategoryName] = useState("");
  const [feeForm, setFeeForm] = useState({
    platform_fee_percent: 0.3,
    seller_fee_percent: 5,
    buyer_fee_percent: 0.3,
    bid_deposit_amount: 500,
    payment_bank_name: "",
    payment_account_title: "",
    payment_account_number: "",
    payment_iban: "",
    payment_instructions: "",
  });
  const [requestFieldsForm, setRequestFieldsForm] = useState([]);
  const [bankAccountsForm, setBankAccountsForm] = useState([]);
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cats, platform] = await Promise.all([getAuctionCategories(), getPlatformSettings()]);
        setCategories(cats);
        setSettings(platform);
        setFeeForm({
          platform_fee_percent: platform.buyer_fee_percent ?? platform.platform_fee_percent,
          seller_fee_percent: platform.seller_fee_percent ?? 5,
          buyer_fee_percent: platform.buyer_fee_percent ?? 0.3,
          bid_deposit_amount: platform.bid_deposit_amount,
          payment_bank_name: platform.payment_bank_name || "",
          payment_account_title: platform.payment_account_title || "",
          payment_account_number: platform.payment_account_number || "",
          payment_iban: platform.payment_iban || "",
          payment_instructions: platform.payment_instructions || "",
        });
        setRequestFieldsForm(buildRequestFieldsFormState(platform.auction_request_fields));
        setBankAccountsForm(buildPaymentBankAccountsFormState(platform.payment_bank_accounts, platform));
        setPaymentInstructions(platform.payment_instructions || "");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCreateStore(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      await createStore({
        storeName: storeForm.storeName,
        city: storeForm.city,
        address: storeForm.address,
        latitude: Number(storeForm.latitude || 0),
        longitude: Number(storeForm.longitude || 0),
        status: storeForm.status,
      });
      const refreshed = await getStores();
      setStores(refreshed);
      setStoreForm({ storeName: "", city: "", address: "", latitude: "", longitude: "", status: "Open" });
      setAdminMessage({ type: "success", title: "Store created", text: "The new pickup store is now available for auctions." });
    } catch (error) {
      setAdminMessage({ type: "error", text: error.message || "Failed to create store." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddCategory(event) {
    event.preventDefault();
    if (!categoryName.trim()) return;
    try {
      setSubmitting(true);
      const created = await createAuctionCategory({ name: categoryName.trim() });
      setCategories((current) => [...current, created]);
      setCategoryName("");
      setAdminMessage({ type: "success", title: "Category added", text: `"${created.name}" is now available in the auction form.` });
    } catch (error) {
      setAdminMessage({ type: "error", text: error.message || "Failed to add category." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      const updated = await updatePlatformSettings({
        seller_fee_percent: feeForm.seller_fee_percent,
        buyer_fee_percent: feeForm.buyer_fee_percent,
        platform_fee_percent: feeForm.seller_fee_percent,
        bid_deposit_amount: feeForm.bid_deposit_amount,
      });
      setSettings(updated);
      setBankAccountsForm(buildPaymentBankAccountsFormState(updated.payment_bank_accounts, updated));
      setPaymentInstructions(updated.payment_instructions || "");
      setRequestFieldsForm(buildRequestFieldsFormState(updated.auction_request_fields));
      setAdminMessage({
        type: "success",
        title: "Settings saved",
        text: "Platform fee settings were updated.",
      });
    } catch (error) {
      setAdminMessage({ type: "error", text: error.message || "Failed to save settings." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveBankAccounts(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      const updated = await updatePlatformSettings({
        ...feeForm,
        payment_bank_accounts: bankAccountsForm,
        payment_instructions: paymentInstructions,
      });
      setSettings(updated);
      setBankAccountsForm(buildPaymentBankAccountsFormState(updated.payment_bank_accounts, updated));
      setPaymentInstructions(updated.payment_instructions || "");
      setAdminMessage({
        type: "success",
        title: "Bank accounts saved",
        text: "Winners can now pay using any enabled bank option on the Won tab.",
      });
    } catch (error) {
      setAdminMessage({ type: "error", text: error.message || "Failed to save bank accounts." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveRequestFields(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      const updated = await updatePlatformSettings({
        ...feeForm,
        auction_request_fields: requestFieldsForm,
      });
      setSettings(updated);
      setRequestFieldsForm(buildRequestFieldsFormState(updated.auction_request_fields));
      setAdminMessage({
        type: "success",
        title: "Form fields saved",
        text: "The Start auction request form now uses your labels and visibility settings.",
      });
    } catch (error) {
      setAdminMessage({ type: "error", text: error.message || "Failed to save form fields." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingWorkspace || loading) {
    return <LoadingState title="Loading stores" copy="Fetching stores, categories, and platform settings." />;
  }

  return (
    <div className="auction-hub admin-mode">
      <div className="mode-switch">
        <button className={tab === "stores" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("stores")} type="button">
          <HiMapPin /> Stores ({stores.length})
        </button>
        <button className={tab === "categories" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("categories")} type="button">
          Categories ({categories.length})
        </button>
        <button className={tab === "settings" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("settings")} type="button">
          <HiCog6Tooth /> Platform fee
        </button>
        <button className={tab === "banks" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("banks")} type="button">
          <HiWallet /> Winner banks
        </button>
        <button className={tab === "form" ? "mode-pill active" : "mode-pill"} onClick={() => setTab("form")} type="button">
          <HiDocumentText /> Request form
        </button>
      </div>

      {tab === "stores" ? (
        <div className="page-grid">
          <article className="section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Pickup locations</p>
                <h3>Registered stores</h3>
              </div>
            </div>
            <div className="table-list">
              {stores.map((store) => (
                <div className="table-row auction-owned-row" key={store._id}>
                  <div>
                    <strong>{store.storeName}</strong>
                    <span>
                      {store.location?.city} · {store.location?.address}
                    </span>
                    <span className={`status-pill ${store.status === "Open" ? "success" : "warning"}`}>{store.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="section-card">
            <p className="section-kicker">Add store</p>
            <form className="form-grid" onSubmit={handleCreateStore}>
              <label>
                Store name
                <input value={storeForm.storeName} onChange={(e) => setStoreForm((c) => ({ ...c, storeName: e.target.value }))} required />
              </label>
              <label>
                City
                <input value={storeForm.city} onChange={(e) => setStoreForm((c) => ({ ...c, city: e.target.value }))} required />
              </label>
              <label className="full-span">
                Address
                <input value={storeForm.address} onChange={(e) => setStoreForm((c) => ({ ...c, address: e.target.value }))} required />
              </label>
              <label>
                Latitude
                <input value={storeForm.latitude} onChange={(e) => setStoreForm((c) => ({ ...c, latitude: e.target.value }))} />
              </label>
              <label>
                Longitude
                <input value={storeForm.longitude} onChange={(e) => setStoreForm((c) => ({ ...c, longitude: e.target.value }))} />
              </label>
              <div className="full-span quick-actions">
                <button className="primary-button" disabled={submitting} type="submit">
                  {submitting ? "Saving..." : "Create store"}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="page-grid">
          <article className="section-card">
            <p className="section-kicker">Auction item types</p>
            <div className="table-list">
              {categories.map((cat) => (
                <div className="table-row auction-owned-row" key={cat.id}>
                  <div>
                    <strong>{cat.name}</strong>
                    <span className="status-pill success">Active</span>
                  </div>
                  <button
                    className="secondary-button danger-outline"
                    disabled={submitting}
                    onClick={async () => {
                      try {
                        setSubmitting(true);
                        await deactivateAuctionCategory(cat.id);
                        setCategories((current) => current.filter((entry) => entry.id !== cat.id));
                        setAdminMessage({ type: "success", title: "Category deactivated", text: `"${cat.name}" was removed from the active list.` });
                      } catch (error) {
                        setAdminMessage({ type: "error", text: error.message || "Failed to deactivate." });
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    type="button"
                  >
                    Deactivate
                  </button>
                </div>
              ))}
            </div>
          </article>
          <article className="section-card">
            <form className="stack-form" onSubmit={handleAddCategory}>
              <label>
                New category name
                <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Electric Scooter" required />
              </label>
              <button className="primary-button" disabled={submitting} type="submit">
                Add category
              </button>
            </form>
          </article>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="page-grid">
          <article className="section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Platform fees</p>
                <h3>Seller & purchaser charges</h3>
              </div>
            </div>
            <p className="muted-copy">
              Seller fee (1–5%) is deducted when you credit the seller wallet. Purchaser fee (0.1–1.9%) is added to the
              winning bid when the buyer pays. Current: seller {settings.seller_fee_percent ?? 5}% · purchaser{" "}
              {settings.buyer_fee_percent ?? 0.3}% · Deposit base: {settings.bid_deposit_amount}
            </p>
            <form className="form-grid" onSubmit={handleSaveSettings}>
              <label>
                Seller fee (%)
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={1}
                  value={feeForm.seller_fee_percent}
                  onChange={(e) =>
                    setFeeForm((c) => ({
                      ...c,
                      seller_fee_percent: Number(e.target.value),
                      platform_fee_percent: c.buyer_fee_percent,
                    }))
                  }
                  required
                />
              </label>
              <label>
                Purchaser fee (%)
                <input
                  type="number"
                  min={0.1}
                  max={1.9}
                  step={0.1}
                  value={feeForm.buyer_fee_percent}
                  onChange={(e) =>
                    setFeeForm((c) => ({
                      ...c,
                      buyer_fee_percent: Number(e.target.value),
                      platform_fee_percent: Number(e.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label>
                Bid deposit amount
                <input
                  type="number"
                  min={1}
                  value={feeForm.bid_deposit_amount}
                  onChange={(e) => setFeeForm((c) => ({ ...c, bid_deposit_amount: Number(e.target.value) }))}
                  required
                />
              </label>
              <div className="full-span quick-actions">
                <button className="primary-button" disabled={submitting} type="submit">
                  Save fee settings
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {tab === "banks" ? (
        <div className="page-grid">
          <article className="section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Winner payment accounts</p>
                <h3>Add up to 3 bank options</h3>
              </div>
            </div>
            <p className="muted-copy">
              Enable one, two, or three accounts. Winners on the Won tab choose any enabled option, transfer bid + platform fee, then tap I paid online.
            </p>
            <form className="stack-form" onSubmit={handleSaveBankAccounts}>
              <PaymentBankAccountsEditor
                accounts={bankAccountsForm}
                instructions={paymentInstructions}
                onAccountsChange={setBankAccountsForm}
                onInstructionsChange={setPaymentInstructions}
              />
              <div className="quick-actions">
                <button className="primary-button" disabled={submitting} type="submit">
                  Save bank accounts
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}

      {tab === "form" ? (
        <div className="page-grid">
          <article className="section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Start auction form</p>
                <h3>Customize request fields</h3>
              </div>
            </div>
            <p className="muted-copy">
              Change labels, placeholders, required/optional tags, and hide optional bike details. Core fields (category, prices, CNIC, store, photos) always stay visible.
            </p>
            <form className="stack-form" onSubmit={handleSaveRequestFields}>
              <AuctionRequestFieldsEditor fields={requestFieldsForm} onChange={setRequestFieldsForm} />
              <div className="quick-actions">
                <button className="primary-button" disabled={submitting} type="submit">
                  Save form fields
                </button>
                <button
                  className="ghost-button"
                  disabled={submitting}
                  onClick={() => setRequestFieldsForm(buildRequestFieldsFormState([]))}
                  type="button"
                >
                  Reset to defaults
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </div>
  );
}

export function AdminIssuesPage() {
  const { issues, loadingWorkspace, setAdminMessage, setIssues } = useAdminApp();
  const [submittingAction, setSubmittingAction] = useState(false);

  if (loadingWorkspace) {
    return <LoadingState title="Loading issue desk" copy="Preparing the latest reported rider and service issues." />;
  }

  if (!issues.length) {
    return <EmptyState title="No issues yet" copy="Reported issues will appear here once riders submit them." />;
  }

  async function handleIssueStatus(issue, status) {
    try {
      setSubmittingAction(true);
      const updated = await updateIssueStatus({
        issue_id: issue.id,
        status,
      });
      setIssues((current) =>
        current.map((entry) => (entry.id === issue.id ? { ...entry, status: updated.status, resolved_at: updated.resolved_at } : entry))
      );
      setAdminMessage({ type: "success", title: "Issue updated", text: `"${issue.title}" is now marked as ${status}.` });
    } catch (error) {
      setAdminMessage({ type: "error", text: error.message || "Failed to update issue status." });
    } finally {
      setSubmittingAction(false);
    }
  }

  return (
    <div className="section-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Reported issues</p>
          <h3>Issue queue</h3>
        </div>
      </div>
      <div className="issue-list">
        {issues.map((issue) => (
          <div className="issue-row" key={issue.id || `${issue.user_id}-${issue.title}`}>
            <div>
              <strong>{issue.title}</strong>
              <span>{issue.description}</span>
              <small>{formatDate(issue.submit_time)}</small>
            </div>
            <div className="inline-actions">
              <span className={`status-pill ${issue.status === "resolved" ? "success" : "warning"}`}>{issue.status || "open"}</span>
              <button
                className="secondary-button"
                disabled={submittingAction || issue.status === "resolved"}
                onClick={() => handleIssueStatus(issue, "resolved")}
                type="button"
              >
                Resolve
              </button>
              <button
                className="secondary-button"
                disabled={submittingAction || issue.status === "open"}
                onClick={() => handleIssueStatus(issue, "open")}
                type="button"
              >
                Reopen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminActivityPage() {
  const { activityItems, loadingWorkspace } = useAdminApp();
  if (loadingWorkspace) {
    return <LoadingState title="Loading activity" copy="Preparing admin activity timeline." />;
  }
  return (
    <div className="section-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Admin activity</p>
          <h3>Operational events</h3>
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
          <EmptyState title="No activity yet" copy="Admin lifecycle events appear here." />
        )}
      </div>
    </div>
  );
}
