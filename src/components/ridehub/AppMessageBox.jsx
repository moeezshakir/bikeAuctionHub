"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiExclamationTriangle,
  HiInformationCircle,
  HiXMark,
} from "react-icons/hi2";

const MessageContext = createContext(null);

const TYPE_META = {
  success: { icon: HiCheckCircle, label: "Success", hint: "Action completed" },
  error: { icon: HiExclamationCircle, label: "Error", hint: "Something went wrong" },
  warning: { icon: HiExclamationTriangle, label: "Attention", hint: "Please review" },
  info: { icon: HiInformationCircle, label: "Notice", hint: "Information" },
};

function normalizePayload(payload) {
  if (typeof payload === "string") {
    return { type: "info", message: payload };
  }
  return {
    type: payload.type || "info",
    title: payload.title,
    message: payload.message || payload.text || "",
    duration: payload.duration,
  };
}

function MessageCard({ entry, onDismiss }) {
  const meta = TYPE_META[entry.type] || TYPE_META.info;
  const Icon = meta.icon;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!entry.duration) return undefined;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, 100 - (elapsed / entry.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [entry.duration, entry.id]);

  return (
    <div className={`app-message app-message-${entry.type}`} role="alert">
      <div className="app-message-icon-wrap">
        <Icon className="app-message-icon" aria-hidden="true" />
      </div>
      <div className="app-message-body">
        <div className="app-message-head">
          <span className="app-message-tag">{meta.label}</span>
          <strong>{entry.title}</strong>
        </div>
        <p>{entry.message}</p>
        <small className="app-message-hint">{meta.hint} · tap X to close</small>
        <div className="app-message-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button aria-label="Dismiss message" className="app-message-close" onClick={() => onDismiss(entry.id)} type="button">
        <HiXMark />
      </button>
    </div>
  );
}

export function MessageBoxProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const dismiss = useCallback((id) => {
    setMessages((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const showMessage = useCallback(
    (payload) => {
      const normalized = normalizePayload(payload);
      if (!normalized.message) return null;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const meta = TYPE_META[normalized.type] || TYPE_META.info;
      const duration = normalized.duration ?? (normalized.type === "error" ? 7000 : 6000);

      setMessages((current) => [
        ...current.slice(-2),
        {
          id,
          type: normalized.type,
          title: normalized.title || meta.label,
          message: normalized.message,
          duration,
        },
      ]);

      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showMessage, dismiss }), [showMessage, dismiss]);

  return (
    <MessageContext.Provider value={value}>
      {children}
      <div className="app-message-stack" aria-live="polite" aria-relevant="additions">
        {messages.map((entry) => (
          <MessageCard entry={entry} key={entry.id} onDismiss={dismiss} />
        ))}
      </div>
    </MessageContext.Provider>
  );
}

export function useAppMessage() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useAppMessage must be used within MessageBoxProvider");
  }
  return context;
}

export function toMessagePayload(payload) {
  const normalized = normalizePayload(payload);
  return {
    type: normalized.type,
    title: normalized.title,
    message: normalized.message,
    duration: normalized.duration,
  };
}
