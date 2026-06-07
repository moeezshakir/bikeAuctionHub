import { connectToDatabase } from "@/lib/server/mongodb";
import { fail, ok } from "@/lib/server/api";
import {
  getPlatformSettings,
  serializePlatformSettingsApi,
  updatePlatformSettings,
} from "@/lib/server/platformSettings";

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await getPlatformSettings();
    return ok({
      status: true,
      data: serializePlatformSettingsApi(settings),
    });
  } catch (error) {
    return fail("Failed to load platform settings", 500, error.message);
  }
}

export async function PATCH(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const settings = await updatePlatformSettings({
      platformFeePercent: body.seller_fee_percent ?? body.platform_fee_percent,
      buyerFeePercent: body.buyer_fee_percent,
      bidDepositAmount: body.bid_deposit_amount,
      paymentBankName: body.payment_bank_name,
      paymentAccountTitle: body.payment_account_title,
      paymentAccountNumber: body.payment_account_number,
      paymentIban: body.payment_iban,
      paymentInstructions: body.payment_instructions,
      paymentBankAccounts: body.payment_bank_accounts,
      auctionRequestFields: body.auction_request_fields,
    });
    return ok({
      status: true,
      message: "Platform settings updated.",
      data: serializePlatformSettingsApi(settings),
    });
  } catch (error) {
    return fail(error.message || "Failed to update settings", 422);
  }
}
