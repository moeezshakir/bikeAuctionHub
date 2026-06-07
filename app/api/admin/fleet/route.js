import { connectToDatabase } from "@/lib/server/mongodb";
import { Bike, BookedBike } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const storeId = Number(searchParams.get("storeId"));

    if (!storeId) {
      return fail("Store ID is required", 422);
    }

    const bikes = await Bike.find({ storeId }).sort({ legacyId: 1 });
    const bookings = await BookedBike.find({ bikeId: { $in: bikes.map((bike) => bike.legacyId) } });
    const bookingMap = new Map(bookings.map((booking) => [booking.bikeId, booking]));

    return ok({
      status: true,
      data: bikes.map((bike) => {
        const booking = bookingMap.get(bike.legacyId);
        return {
          id: bike.legacyId,
          store_id: bike.storeId,
          type: bike.type,
          imageUrl: bike.imageUrl,
          pricePerHour: bike.pricePerHour,
          bikeBookingStatus: (bike.bikeBookingStatus || "").trim(),
          ...(booking
            ? {
                booking: {
                  userId: booking.userId,
                  bikeId: booking.bikeId,
                  location: booking.location,
                  startTime: booking.startTime,
                  endTime: booking.endTime,
                  bookingStatus: booking.status,
                },
              }
            : {}),
        };
      }),
    });
  } catch (error) {
    return fail("Failed to load admin fleet", 500, error.message);
  }
}
