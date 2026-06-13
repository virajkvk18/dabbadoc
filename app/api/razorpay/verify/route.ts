import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import {
  enforcePaymentRateLimit,
  enforceRequestSizeLimit,
  MAX_JSON_BYTES
} from "@/lib/security/abuse-protection";
import { apiErrorResponse, ApiError } from "@/lib/security/api-errors";
import { getPaymentOrderForUser, markPaymentCaptured } from "@/lib/supabase/mutations";
import { razorpayVerifySchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforcePaymentRateLimit(request, user.id);
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);

    const payload = razorpayVerifySchema.parse(await request.json().catch(() => ({})));

    const ownedOrder = await getPaymentOrderForUser({
      userId: user.id,
      razorpayOrderId: payload.razorpay_order_id
    });

    if (!ownedOrder) {
      throw new ApiError("Payment order not found for this account.", 403);
    }

    const valid = verifyRazorpaySignature({
      orderId: payload.razorpay_order_id,
      paymentId: payload.razorpay_payment_id,
      signature: payload.razorpay_signature
    });

    if (!valid) {
      return NextResponse.json(
        {
          valid: false,
          message: "Payment signature could not be verified."
        },
        { status: 400 }
      );
    }

    await markPaymentCaptured({
      userId: user.id,
      razorpayOrderId: payload.razorpay_order_id,
      razorpayPaymentId: payload.razorpay_payment_id
    });

    return NextResponse.json({
      valid: true,
      message: "Payment verified. Premium access updated."
    });
  } catch (error) {
    return apiErrorResponse(error, "Payment verification failed", 400, {
      request,
      route: "/api/razorpay/verify"
    });
  }
}
