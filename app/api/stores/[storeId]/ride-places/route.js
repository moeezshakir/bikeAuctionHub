import { connectToDatabase } from "@/lib/server/mongodb";
import { RidePlace } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const storeId = Number(params.storeId);
    const ridePlace = await RidePlace.findOne({ storeId });

    return ok({
      status: true,
      data: ridePlace?.locations || [],
    });
  } catch (error) {
    return fail("Failed to load ride places", 500, error.message);
  }
}
