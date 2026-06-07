import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/server/mongodb";
import { RegisteredUser } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    const userId = Number(params.userId);
    const body = await request.json();
    const currentPassword = String(body.current_password || "");
    const newPassword = String(body.new_password || "");

    if (!currentPassword || !newPassword) {
      return fail("Current and new password are required.", 422);
    }

    if (newPassword.length < 6) {
      return fail("New password must be at least 6 characters.", 422);
    }

    const user = await RegisteredUser.findOne({ legacyId: userId });
    if (!user) {
      return fail("User not found", 404);
    }

    const currentMatches =
      (user.password.startsWith("$2") && (await bcrypt.compare(currentPassword, user.password))) ||
      user.password === currentPassword;

    if (!currentMatches) {
      return fail("Current password is incorrect.", 401);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return ok({
      status: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    return fail("Failed to update password", 500, error.message);
  }
}
