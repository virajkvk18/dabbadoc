import "server-only";

import crypto from "crypto";
import Razorpay from "razorpay";
import { ApiError } from "@/lib/security/api-errors";
import type { PaymentOrderResponse } from "@/types";

const PREMIUM_AMOUNT_PAISE = 29900;

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function timingSafeHexCompare(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function createPremiumOrder(params: { userId: string }) {
  const amount = PREMIUM_AMOUNT_PAISE;

  if (!isRazorpayConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("Secure checkout is not configured.", 503);
    }

    return {
      id: `mock_order_${Date.now()}`,
      amount,
      currency: "INR",
      plan: "premium",
      mock: true
    } satisfies PaymentOrderResponse;
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
  });

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `dabbadoc_${Date.now()}`,
    notes: {
      plan: "premium",
      user_id: params.userId
    }
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    plan: "premium",
    mock: false
  } satisfies PaymentOrderResponse;
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !params.signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  return timingSafeHexCompare(expected, params.signature);
}

export function verifyWebhookSignature(body: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeHexCompare(expected, signature);
}
