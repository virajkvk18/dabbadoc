import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { enforceRequestSizeLimit, MAX_JSON_BYTES } from "@/lib/security/abuse-protection";
import { apiErrorResponse, ApiError } from "@/lib/security/api-errors";
import { markPaymentCapturedByOrderId } from "@/lib/supabase/mutations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);

    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!verifyWebhookSignature(body, signature)) {
      throw new ApiError("Invalid webhook signature", 401);
    }

    const event = JSON.parse(body) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
          };
        };
      };
    };

    const payment = event.payload?.payment?.entity;
    let updatedPaymentId: string | null = null;

    if (event.event === "payment.captured" && payment?.order_id && payment.id) {
      updatedPaymentId = await markPaymentCapturedByOrderId({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id
      });
    }

    return NextResponse.json({
      received: true,
      event: event.event,
      updated: Boolean(updatedPaymentId)
    });
  } catch (error) {
    return apiErrorResponse(error, "Razorpay webhook failed", 400, {
      request,
      route: "/api/webhooks/razorpay"
    });
  }
}
