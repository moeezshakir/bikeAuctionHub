export const USER_SESSION_KEY = "rrh-user-session";
export const ADMIN_SESSION_KEY = "rrh-admin-session";

export function readStoredSession(key) {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function writeStoredSession(key, payload) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function clearStoredSession(key) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}
