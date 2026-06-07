import { connectToDatabase } from "@/lib/server/mongodb";
import { NotificationEvent } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const role = String(searchParams.get("role") || "user");
    const userId = Number(searchParams.get("userId") || 0);
    const storeId = Number(searchParams.get("storeId") || 0);
    const limit = Math.min(Number(searchParams.get("limit") || 25), 100);

    const query = { role };
    if (role === "user" && userId) query.userId = userId;
    if (role === "admin" && storeId) query.adminStoreId = storeId;

    const notifications = await NotificationEvent.find(query).sort({ createdAt: -1 }).limit(limit);
    const unreadCount = await NotificationEvent.countDocuments({ ...query, isRead: false });
    return ok({
      status: true,
      unreadCount,
      data: notifications.map((item) => ({
        id: String(item._id),
        type: item.type,
        title: item.title,
        message: item.message,
        is_read: item.isRead,
        metadata: item.metadata || {},
        created_at: item.createdAt,
      })),
    });
  } catch (error) {
    return fail("Failed to fetch notifications", 500, error.message);
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const role = String(body.role || "user");
    const userId = Number(body.userId || 0);
    const storeId = Number(body.storeId || 0);
    const notificationId = String(body.notificationId || "");
    const markAll = Boolean(body.markAll);

    const query = { role };
    if (role === "user" && userId) query.userId = userId;
    if (role === "admin" && storeId) query.adminStoreId = storeId;

    if (markAll) {
      await NotificationEvent.updateMany(query, { $set: { isRead: true } });
    } else if (notificationId) {
      await NotificationEvent.updateOne({ _id: notificationId, ...query }, { $set: { isRead: true } });
    } else {
      return fail("notificationId or markAll is required.", 422);
    }

    return ok({ status: true, message: "Notifications updated." });
  } catch (error) {
    return fail("Failed to update notifications", 500, error.message);
  }
}
