import { connectToDatabase } from "@/lib/server/mongodb";
import { NotificationEvent } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const userId = Number(params.userId);
    const items = await NotificationEvent.find({ role: "user", userId }).sort({ createdAt: -1 }).limit(100);
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
    return fail("Failed to load user activity", 500, error.message);
  }
}
