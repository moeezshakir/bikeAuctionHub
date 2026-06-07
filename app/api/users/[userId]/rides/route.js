import { connectToDatabase } from "@/lib/server/mongodb";
import { Bike, BikeRental, BookedBike, RentalStore, UserRequiredInfo, Wallet } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";
import { createAdminNotification, createUserNotification } from "@/lib/server/notifications";

export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const userId = Number(params.userId);
    const rides = await BikeRental.find({ userId }).sort({ startTime: -1 });

    return ok({
      status: true,
      data: rides.map((ride) => ({
        user_id: ride.userId,
        store_id: ride.storeId,
        bike_id: ride.bikeId,
        bike_type: ride.bikeType,
        start_time: ride.startTime,
        end_time: ride.endTime,
        location: ride.location,
        status: ride.status,
      })),
    });
  } catch (error) {
    return fail("Failed to load rides", 500, error.message);
  }
}

export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    const userId = Number(params.userId);
    const body = await request.json();
    const bikeId = Number(body.bikeId);
    const durationHours = Number(body.duration);
    const location = String(body.location || "").trim();
    const startRaw = body.startTime ? new Date(body.startTime) : new Date();

    if (!bikeId || !durationHours || durationHours <= 0 || !location) {
      return fail("Bike, duration, and location are required.", 422);
    }

    const bike = await Bike.findOne({ legacyId: bikeId });
    if (!bike) {
      return fail("Bike not found.", 404);
    }

    if (String(bike.bikeBookingStatus || "").trim() !== "available") {
      return fail("This bike is currently not available.", 409);
    }

    const wallet = await Wallet.findOne({ userId });
    const totalPrice = Number(bike.pricePerHour || 0) * durationHours;
    if (!wallet || Number(wallet.remainingBalance || 0) < totalPrice) {
      return fail("Insufficient balance.", 400, `Required ${totalPrice}`);
    }

    const alreadyBooked = await BookedBike.findOne({ userId, status: "booked" });
    if (alreadyBooked) {
      return fail("You already have an active booked ride.", 409);
    }

    const requiredInfo = await UserRequiredInfo.findOne({ userId });
    if (!requiredInfo?.cnic || !requiredInfo?.recoveryEmail || !requiredInfo?.recoveryPhoneNumber) {
      return fail("Complete required profile info before booking a ride.", 422);
    }

    const startTime = Number.isNaN(startRaw.getTime()) ? new Date() : startRaw;
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    const latestBooking = await BookedBike.findOne().sort({ legacyId: -1 }).select("legacyId");
    const nextBookingLegacyId = (latestBooking?.legacyId || 0) + 1;

    wallet.remainingBalance = Number(wallet.remainingBalance || 0) - totalPrice;
    bike.bikeBookingStatus = "booked";

    await Promise.all([
      wallet.save(),
      bike.save(),
      BookedBike.create({
        legacyId: nextBookingLegacyId,
        userId,
        bikeId,
        location,
        startTime,
        endTime,
        status: "booked",
      }),
      BikeRental.create({
        userId,
        storeId: bike.storeId,
        bikeId,
        bikeType: bike.type,
        startTime,
        endTime,
        location,
        status: "booked",
      }),
      RentalStore.updateOne({ legacyId: bike.storeId }, { $inc: { bikeleft: -1 } }),
      createUserNotification({
        userId,
        type: "ride_booked",
        title: "Ride booked",
        message: `Bike #${bikeId} is booked successfully for ${location}.`,
        metadata: { bikeId, storeId: bike.storeId, location, totalPrice },
      }),
      createAdminNotification({
        adminStoreId: bike.storeId,
        type: "ride_booked",
        title: "New ride booking",
        message: `Bike #${bikeId} was booked by user #${userId}.`,
        metadata: { bikeId, userId, location },
      }),
    ]);

    return ok({
      status: true,
      message: "Bike booked successfully.",
      data: {
        user_id: userId,
        bike_id: bikeId,
        total_price: totalPrice,
        remaining_balance: wallet.remainingBalance,
      },
    });
  } catch (error) {
    return fail("Failed to book ride", 500, error.message);
  }
}
