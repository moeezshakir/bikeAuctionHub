import { connectToDatabase } from "@/lib/server/mongodb";
import { RentalStore } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

function serializeStore(store) {
  return {
    _id: store.legacyId,
    location: store.location,
    image: store.image || "",
    bikeleft: store.bikeleft || 0,
    types_of_bike: store.typesOfBike || [],
    status: store.status || "Open",
    storeName: store.storeName || "",
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    const stores = await RentalStore.find().sort({ legacyId: 1 });

    return ok({
      status: true,
      data: stores.map(serializeStore),
    });
  } catch (error) {
    return fail("Failed to load stores", 500, error.message);
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const storeName = String(body.storeName || body.store_name || "").trim();
    const city = String(body.city || body.location?.city || "").trim();
    const address = String(body.address || body.location?.address || "").trim();
    const latitude = Number(body.latitude ?? body.location?.latitude ?? 0);
    const longitude = Number(body.longitude ?? body.location?.longitude ?? 0);
    const status = String(body.status || "Open").trim();

    if (!storeName || !city || !address) {
      return fail("Store name, city, and address are required.", 422);
    }

    const latest = await RentalStore.findOne().sort({ legacyId: -1 }).select("legacyId");
    const nextId = (latest?.legacyId || 0) + 1;

    const store = await RentalStore.create({
      legacyId: nextId,
      storeName,
      status,
      bikeleft: Number(body.bikeleft || 0),
      typesOfBike: body.types_of_bike || body.typesOfBike || [],
      image: body.image || "",
      location: { latitude, longitude, address, city },
    });

    return ok({
      status: true,
      message: "Store created.",
      data: serializeStore(store),
    });
  } catch (error) {
    return fail("Failed to create store", 500, error.message);
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const storeId = Number(body.store_id || body._id);
    if (!storeId) {
      return fail("Store id is required.", 422);
    }

    const store = await RentalStore.findOne({ legacyId: storeId });
    if (!store) {
      return fail("Store not found.", 404);
    }

    if (body.storeName || body.store_name) {
      store.storeName = String(body.storeName || body.store_name).trim();
    }
    if (body.status) {
      store.status = String(body.status).trim();
    }
    if (body.bikeleft !== undefined) {
      store.bikeleft = Number(body.bikeleft);
    }
    if (body.location || body.city || body.address) {
      store.location = {
        latitude: Number(body.latitude ?? body.location?.latitude ?? store.location?.latitude ?? 0),
        longitude: Number(body.longitude ?? body.location?.longitude ?? store.location?.longitude ?? 0),
        address: String(body.address || body.location?.address || store.location?.address || "").trim(),
        city: String(body.city || body.location?.city || store.location?.city || "").trim(),
      };
    }
    await store.save();

    return ok({
      status: true,
      message: "Store updated.",
      data: serializeStore(store),
    });
  } catch (error) {
    return fail("Failed to update store", 500, error.message);
  }
}
