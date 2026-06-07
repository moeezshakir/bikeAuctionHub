import { connectToDatabase } from "@/lib/server/mongodb";
import { Bike, BikeRental, BookedBike, RentalStore } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";
import { createAdminNotification, createUserNotification } from "@/lib/server/notifications";

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const bikeId = Number(body.bikeId);
    const storeId = Number(body.store_id);
    const userId = Number(body.userId);

    if (!bikeId || !storeId || !userId) {
      return fail("bikeId, store_id, and userId are required.", 422);
    }

    const booking = await BookedBike.findOne({ bikeId, userId });
    if (!booking) {
      return fail("Active booking not found for this user and bike.", 404);
    }

    await Promise.all([
      BookedBike.deleteOne({ _id: booking._id }),
      Bike.updateOne({ legacyId: bikeId, storeId }, { $set: { bikeBookingStatus: "available" } }),
      BikeRental.updateOne(
        { userId, bikeId, storeId, status: { $ne: "Complete" } },
        { $set: { status: "Complete", endTime: new Date() } }
      ),
      RentalStore.updateOne({ legacyId: storeId }, { $inc: { bikeleft: 1 } }),
      createUserNotification({
        userId,
        type: "ride_finished",
        title: "Ride completed",
        message: `Your ride for bike #${bikeId} has been marked complete by admin.`,
        metadata: { bikeId, storeId },
      }),
      createAdminNotification({
        adminStoreId: storeId,
        type: "ride_finished",
        title: "Ride closed",
        message: `Ride for bike #${bikeId} has been completed.`,
        metadata: { bikeId, userId },
      }),
    ]);

    return ok({
      status: true,
      message: "Ride finished successfully.",
    });
  } catch (error) {
    return fail("Failed to finish ride", 500, error.message);
  }
}
