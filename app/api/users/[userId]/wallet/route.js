import { connectToDatabase } from "@/lib/server/mongodb";
import { Wallet } from "@/lib/server/models";
import { fail, ok } from "@/lib/server/api";

export async function GET(_request, { params }) {
  try {
    await connectToDatabase();
    const userId = Number(params.userId);
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({
        legacyId: userId,
        userId,
        remainingBalance: 0,
      });
    }

    return ok({
      status: true,
      data: {
        user_id: userId,
        remainingBalance: wallet.remainingBalance || 0,
      },
    });
  } catch (error) {
    return fail("Failed to load wallet", 500, error.message);
  }
}

export async function POST(request, { params }) {
  try {
    await connectToDatabase();
    const userId = Number(params.userId);
    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return fail("A valid recharge amount is required.", 422);
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({
        legacyId: userId,
        userId,
        remainingBalance: 0,
      });
    }

    wallet.remainingBalance = Number(wallet.remainingBalance || 0) + amount;
    await wallet.save();

    return ok({
      status: true,
      message: "Wallet recharged successfully.",
      data: {
        user_id: userId,
        remainingBalance: wallet.remainingBalance,
      },
    });
  } catch (error) {
    return fail("Failed to recharge wallet", 500, error.message);
  }
}
