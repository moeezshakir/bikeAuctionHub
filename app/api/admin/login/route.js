import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/server/mongodb";
import { Admin } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return fail("Email and password are required.", 422);
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return fail("Invalid credentials", 401);
    }

    const passwordMatches =
      (admin.password.startsWith("$2") && (await bcrypt.compare(password, admin.password))) ||
      admin.password === password;

    if (!passwordMatches) {
      return fail("Invalid credentials", 401);
    }

    return ok({
      status: true,
      data: {
        user_id: admin.legacyId,
        store_id: admin.storeId,
        isEmailVerified: true,
      },
      message: "Login successful.",
    });
  } catch (error) {
    return fail("Admin login failed", 500, error.message);
  }
}
