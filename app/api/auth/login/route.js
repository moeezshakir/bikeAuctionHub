import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/server/mongodb";
import { RegisteredUser, UserProfile } from "@/lib/server/models";
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

    const user = await RegisteredUser.findOne({ email });
    if (!user) {
      return fail("Invalid credentials", 401);
    }

    const profile = await UserProfile.findOne({ legacyId: user.legacyId });
    if (!profile || !profile.accountVerifiedStatus) {
      return fail("Please verify your email address first", 403);
    }

    const passwordMatches =
      (user.password.startsWith("$2") && (await bcrypt.compare(password, user.password))) ||
      user.password === password;

    if (!passwordMatches) {
      return fail("Invalid credentials", 401);
    }

    return ok({
      status: true,
      data: {
        user_id: user.legacyId,
        isEmailVerified: true,
        profile_pic: profile.profilePic || "",
      },
      message: "Login successful.",
    });
  } catch (error) {
    return fail("Login failed", 500, error.message);
  }
}
