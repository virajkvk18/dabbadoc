import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { createPremiumOrder } from "@/lib/payments/razorpay";
import {
  enforcePaymentRateLimit,
  enforceRequestSizeLimit,
  MAX_JSON_BYTES
} from "@/lib/security/abuse-protection";
import { apiErrorResponse, ApiError } from "@/lib/security/api-errors";
import { savePaymentOrder } from "@/lib/supabase/mutations";
import { razorpayOrderSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforcePaymentRateLimit(request, user.id);
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);

    razorpayOrderSchema.parse(await request.json().catch(() => ({})));

    const order = await createPremiumOrder({ userId: user.id });
    const savedOrderId = await savePaymentOrder({
      userId: user.id,
      razorpayOrderId: order.id,
      amount: order.amount,
      plan: order.plan,
      mock: order.mock
    });

    if (!savedOrderId && !order.mock) {
      throw new ApiError("Could not start secure checkout.", 503);
    }

    return NextResponse.json({ order });
  } catch (error) {
    return apiErrorResponse(error, "Could not create order", 400, {
      request,
      route: "/api/razorpay"
    });
  }
}
