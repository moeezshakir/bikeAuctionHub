import { connectToDatabase } from "@/lib/server/mongodb";
import { OtpVerification, RegisteredUser } from "@/lib/server/models";
import { fail, generateOtp, ok } from "@/lib/server/api";

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return fail("Email is required.", 422);
    }

    const user = await RegisteredUser.findOne({ email });
    if (!user) {
      return fail("Email not found", 404);
    }

    const otp = generateOtp();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

    await OtpVerification.findOneAndUpdate(
      { userId: user.legacyId },
      { otp, expirationTime },
      { upsert: true, new: true }
    );

    return ok({
      status: true,
      message: "Reset request created.",
      user_id: user.legacyId,
      email: user.email,
      otp,
    });
  } catch (error) {
    return fail("Reset request failed", 500, error.message);
  }
}
