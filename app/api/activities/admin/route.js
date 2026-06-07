import { connectToDatabase } from "@/lib/server/mongodb";
import { NotificationEvent } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = Number(searchParams.get("storeId") || 0);
    if (!storeId) {
      return fail("storeId is required", 422);
    }
    const items = await NotificationEvent.find({ role: "admin", adminStoreId: storeId }).sort({ createdAt: -1 }).limit(100);
    return ok({
      status: true,
      data: items.map((item) => ({
        id: String(item._id),
        type: item.type,
        title: item.title,
        message: item.message,
        metadata: item.metadata || {},
        is_read: item.isRead,
        created_at: item.createdAt,
      })),
    });
  } catch (error) {
    return fail("Failed to load admin activity", 500, error.message);
  }
}
