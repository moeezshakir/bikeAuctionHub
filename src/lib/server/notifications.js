import { NotificationEvent } from "@/lib/server/models";

export async function createUserNotification({ userId, type, title, message, metadata = {} }) {
  if (!userId) return null;
  return NotificationEvent.create({
    userId,
    role: "user",
    type,
    title,
    message,
    metadata,
  });
}

export async function createAdminNotification({ adminStoreId, type, title, message, metadata = {} }) {
  if (!adminStoreId) return null;
  return NotificationEvent.create({
    adminStoreId,
    role: "admin",
    type,
    title,
    message,
    metadata,
  });
}
