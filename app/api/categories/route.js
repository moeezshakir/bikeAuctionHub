import { connectToDatabase } from "@/lib/server/mongodb";
import { AuctionCategory } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await AuctionCategory.find({ active: true }).sort({ legacyId: 1 });
    return ok({
      status: true,
      data: categories.map((entry) => ({
        id: entry.legacyId,
        name: entry.name,
        active: entry.active,
      })),
    });
  } catch (error) {
    return fail("Failed to load categories", 500, error.message);
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return fail("Category name is required.", 422);
    }

    const latest = await AuctionCategory.findOne().sort({ legacyId: -1 }).select("legacyId");
    const nextId = (latest?.legacyId || 0) + 1;

    await AuctionCategory.create({
      legacyId: nextId,
      name,
      active: body.active !== false,
    });

    return ok({
      status: true,
      message: "Category added.",
      data: { id: nextId, name, active: true },
    });
  } catch (error) {
    return fail("Failed to create category", 500, error.message);
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return fail("Category id is required.", 422);
    }

    const category = await AuctionCategory.findOne({ legacyId: id });
    if (!category) {
      return fail("Category not found.", 404);
    }

    if (body.name !== undefined) {
      category.name = String(body.name).trim();
    }
    if (body.active !== undefined) {
      category.active = Boolean(body.active);
    }
    await category.save();

    return ok({
      status: true,
      message: "Category updated.",
      data: { id: category.legacyId, name: category.name, active: category.active },
    });
  } catch (error) {
    return fail("Failed to update category", 500, error.message);
  }
}

export async function DELETE(request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return fail("Category id is required.", 422);
    }

    const category = await AuctionCategory.findOne({ legacyId: id });
    if (!category) {
      return fail("Category not found.", 404);
    }

    category.active = false;
    await category.save();

    return ok({ status: true, message: "Category deactivated." });
  } catch (error) {
    return fail("Failed to delete category", 500, error.message);
  }
}
