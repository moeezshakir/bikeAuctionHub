"use client";

import {
  HiCheckCircle,
  HiExclamationTriangle,
  HiInformationCircle,
  HiStopCircle,
  HiXMark,
} from "react-icons/hi2";

const VARIANTS = {
  danger: {
    icon: HiStopCircle,
    confirmClass: "primary-button danger-button",
    iconClass: "dialog-icon-danger",
  },
  warning: {
    icon: HiExclamationTriangle,
    confirmClass: "primary-button",
    iconClass: "dialog-icon-warning",
  },
  success: {
    icon: HiCheckCircle,
    confirmClass: "primary-button success-button",
    iconClass: "dialog-icon-success",
  },
  info: {
    icon: HiInformationCircle,
    confirmClass: "primary-button",
    iconClass: "dialog-icon-info",
  },
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const meta = VARIANTS[variant] || VARIANTS.warning;
  const Icon = meta.icon;

  return (
    <div className="dialog-overlay app-dialog-overlay" onClick={onCancel} role="presentation">
      <div
        className="dialog-card app-dialog-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
      >
        <button aria-label="Close dialog" className="app-dialog-close" onClick={onCancel} type="button">
          <HiXMark />
        </button>
        <div className={`app-dialog-icon ${meta.iconClass}`}>
          <Icon aria-hidden="true" />
        </div>
        <p className="section-kicker">Please confirm</p>
        <h3 id="app-dialog-title">{title}</h3>
        <p className="app-dialog-message">{message}</p>
        <div className="app-dialog-actions">
          <button className="secondary-button" disabled={loading} onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button className={meta.confirmClass} disabled={loading} onClick={onConfirm} type="button">
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PromptDialog({
  open,
  title,
  message,
  placeholder = "Optional note",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  value,
  onChange,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="dialog-overlay app-dialog-overlay" onClick={onCancel} role="presentation">
      <div
        className="dialog-card app-dialog-card app-dialog-prompt"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-prompt-title"
      >
        <button aria-label="Close dialog" className="app-dialog-close" onClick={onCancel} type="button">
          <HiXMark />
        </button>
        <div className="app-dialog-icon dialog-icon-info">
          <HiInformationCircle aria-hidden="true" />
        </div>
        <p className="section-kicker">Additional details</p>
        <h3 id="app-prompt-title">{title}</h3>
        <p className="app-dialog-message">{message}</p>
        <label className="app-dialog-field">
          <span>Note (optional)</span>
          <textarea onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} rows={3} value={value} />
        </label>
        <div className="app-dialog-actions">
          <button className="secondary-button" disabled={loading} onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button className="primary-button" disabled={loading} onClick={onConfirm} type="button">
            {loading ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
