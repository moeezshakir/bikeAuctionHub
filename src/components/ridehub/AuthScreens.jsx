"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppMessage } from "@/components/ridehub/AppMessageBox";
import {
  ADMIN_SESSION_KEY,
  readStoredSession,
  USER_SESSION_KEY,
  writeStoredSession,
} from "@/lib/session";
import {
  loginAdmin,
  loginUser,
  registerUser,
  requestPasswordReset,
} from "@/lib/legacyApi";

function AuthField({ label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  );
}

function MetricCard({ label, value, note }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}

export function UserAuthScreen({ mode }) {
  const router = useRouter();
  const { showMessage } = useAppMessage();
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (readStoredSession(USER_SESSION_KEY)) {
      router.replace("/home");
    }
  }, [router]);

  const isSignin = mode === "signin";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgotPassword";

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isSignup) {
        const response = await registerUser(credentials);
        showMessage({
          type: "success",
          title: "Account created",
          message:
            response.message ||
            "Your account was created. Please sign in to continue.",
        });
        router.push("/signin");
        return;
      }

      if (isForgot) {
        const response = await requestPasswordReset({
          email: credentials.email,
        });
        showMessage({
          type: "info",
          title: "Reset link sent",
          message:
            response.message ||
            "If this email exists, a password reset link has been sent.",
        });
        return;
      }

      const result = await loginUser(credentials);
      writeStoredSession(USER_SESSION_KEY, result.session);
      showMessage({
        type: "success",
        title: "Login successful",
        message:
          result.message || "Welcome back! Taking you to your dashboard…",
        duration: 2500,
      });
      router.push("/home");
    } catch (error) {
      showMessage({
        type: "error",
        title: isSignup
          ? "Signup failed"
          : isForgot
            ? "Reset failed"
            : "Login failed",
        message: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-visual">
        <div>
          <p className="auth-eyebrow">{process.env.NEXT_PUBLIC_APP_NAME || "Bike Auction Hub"}</p>
          <h1>List your bike, join live auctions, settle at trusted stores.</h1>
          <p>
            Submit your bike for admin review, start timed auctions, and
            complete pickup and payment through a clear step-by-step flow.
          </p>
        </div>
        <div className="auth-metrics">
          <MetricCard
            label="Auction stores"
            value="City-wide"
            note="Trusted pickup locations"
          />
          <MetricCard
            label="Live bidding"
            value="6h slots"
            note="Timed auctions with clear rules"
          />
          <MetricCard
            label="Settlement"
            value="3-step"
            note="Pay, credit, admin confirm"
          />
        </div>
      </section>

      <section className="auth-card">
        <p className="auth-eyebrow">Account</p>
        <h2>
          {isSignup ? "Create account" : isForgot ? "Reset password" : "Login"}
        </h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup ? (
            <AuthField
              label="Username"
              value={credentials.username}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              placeholder="Rider name"
            />
          ) : null}
          <AuthField
            label="Email"
            type="email"
            value={credentials.email}
            onChange={(event) =>
              setCredentials((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="you@example.com"
          />
          {!isForgot ? (
            <AuthField
              label="Password"
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Enter password"
            />
          ) : null}
          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : isForgot
                  ? "Send reset link"
                  : "Login"}
          </button>
        </form>
        <div className="auth-links">
          {!isSignup && !isForgot ? (
            <span className="auth-links-muted">New here?</span>
          ) : null}
          {isSignin && <Link href="/signup">Create account</Link>}
          {isSignup && <Link href="/signin">Sign In</Link>}
          <Link href="/forgotPassword">Forgot password</Link>
        </div>
      </section>
    </div>
  );
}

export function AdminAuthScreen() {
  const router = useRouter();
  const { showMessage } = useAppMessage();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (readStoredSession(ADMIN_SESSION_KEY)) {
      router.replace("/admin/admin-home");
    }
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await loginAdmin(credentials);
      writeStoredSession(ADMIN_SESSION_KEY, result.session);
      showMessage({
        type: "success",
        title: "Admin login successful",
        message: result.message || "Welcome back. Opening the operations desk…",
        duration: 2500,
      });
      router.push("/admin/admin-home");
    } catch (error) {
      showMessage({
        type: "error",
        title: "Admin login failed",
        message: error.message || "Invalid email or password.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-visual">
        <div>
          <p className="auth-eyebrow">Admin control</p>
          <h1>
            Review requests, run auctions, and close settlements from one desk.
          </h1>
          <p>
            Inspect CNIC and bike details, approve or reject within 48 hours,
            and track successful auctions with payment forms.
          </p>
        </div>
        <div className="auth-metrics">
          <MetricCard
            label="Review queue"
            value="48h SLA"
            note="Pending auction requests"
          />
          <MetricCard
            label="Live auctions"
            value="Tracked"
            note="Bids and winner flow"
          />
          <MetricCard label="Issues" value="Desk" note="User support reports" />
        </div>
      </section>

      <section className="auth-card">
        <p className="auth-eyebrow">Admin access</p>
        <h2>Login</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <AuthField
            label="Admin email"
            type="email"
            value={credentials.email}
            onChange={(event) =>
              setCredentials((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="admin@example.com"
          />
          <AuthField
            label="Password"
            type="password"
            value={credentials.password}
            onChange={(event) =>
              setCredentials((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder="Enter password"
          />
          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Please wait..." : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
}
