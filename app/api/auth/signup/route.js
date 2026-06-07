import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/server/mongodb";
import { OtpVerification, RegisteredUser, UserProfile, Wallet } from "@/lib/server/models";
import { fail, generateOtp, ok } from "@/lib/server/api";

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const username = String(body.username || body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !email || !password) {
      return fail("Name, email, and password are required.", 422);
    }

    const existingUser = await RegisteredUser.findOne({ email });
    if (existingUser) {
      return fail("Email already exists", 409);
    }

    const highestUser = await RegisteredUser.findOne().sort({ legacyId: -1 }).select("legacyId");
    const nextUserId = (highestUser?.legacyId || 0) + 1;
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    await RegisteredUser.create({
      legacyId: nextUserId,
      username,
      email,
      password: hashedPassword,
    });

    await UserProfile.create({
      legacyId: nextUserId,
      name: username,
      email,
      accountVerifiedStatus: true,
    });

    await Wallet.create({
      legacyId: nextUserId,
      userId: nextUserId,
      remainingBalance: 0,
    });

    await OtpVerification.findOneAndUpdate(
      { userId: nextUserId },
      { otp, expirationTime },
      { upsert: true, new: true }
    );

    return ok({
      status: true,
      message: "Signup successful.",
      otp,
      user_id: nextUserId,
      userEmail: email,
    });
  } catch (error) {
    return fail("Signup failed", 500, error.message);
  }
}
