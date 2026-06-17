import "server-only";

import crypto from "crypto";
import Razorpay from "razorpay";
import { getPaidPlan } from "@/lib/plans";
import { ApiError } from "@/lib/security/api-errors";
import type { PaidPlanType, PaymentOrderResponse } from "@/types";

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

export async function createPremiumOrder(params: {
  userId: string;
  plan: PaidPlanType;
}) {
  const selectedPlan = getPaidPlan(params.plan);
  const amount = selectedPlan.amountPaise;

  if (!isRazorpayConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("Secure checkout is not configured.", 503);
    }

    return {
      id: `mock_order_${params.plan}_${Date.now()}`,
      amount,
      currency: "INR",
      plan: params.plan,
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
    receipt: `dd_${params.plan}_${Date.now()}`.slice(0, 40),
    notes: {
      plan: params.plan,
      user_id: params.userId
    }
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    plan: params.plan,
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
