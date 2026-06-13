"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PaymentOrder = {
  id: string;
  amount: number;
  currency: string;
  mock: boolean;
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  name: string;
  description: string;
  order_id: string;
  amount: number;
  currency: string;
  theme: { color: string };
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

function loadRazorpayCheckout() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PricingCard({
  plan,
  price,
  features,
  premium,
  authenticated
}: {
  plan: string;
  price: string;
  features: string[];
  premium?: boolean;
  authenticated?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function startCheckout() {
    if (!premium) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "premium" })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        order?: PaymentOrder;
        error?: string;
      };

      if (!response.ok || !payload.order) {
        setLoading(false);
        if (response.status === 401 || response.status === 403) {
          setMessage("Please log in with a verified account to start premium.");
          router.push("/auth?next=/pricing");
          return;
        }

        setMessage(payload.error ?? "Could not start secure checkout.");
        return;
      }

      if (payload.order.mock) {
        setLoading(false);
        setMessage("Secure checkout preview created. Add Razorpay test keys for live test mode.");
        return;
      }

      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!key) {
        setLoading(false);
        setMessage("Razorpay public key is missing. Restart the dev server after adding it.");
        return;
      }

      const loaded = await loadRazorpayCheckout();
      if (!loaded || !window.Razorpay) {
        setLoading(false);
        setMessage("Could not load secure checkout. Check your connection and try again.");
        return;
      }

      const checkout = new window.Razorpay({
        key,
        name: "DabbaDoc",
        description: "Premium monthly plan",
        order_id: payload.order.id,
        amount: payload.order.amount,
        currency: payload.order.currency,
        theme: { color: "#81f759" },
        modal: {
          ondismiss() {
            setLoading(false);
            setMessage("Checkout was closed.");
          }
        },
        async handler(payment) {
          setLoading(true);
          setMessage("Verifying payment...");

          const verifyResponse = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment)
          });
          const verifyPayload = (await verifyResponse.json().catch(() => ({}))) as {
            message?: string;
            error?: string;
          };

          setLoading(false);
          setMessage(
            verifyResponse.ok
              ? verifyPayload.message ?? "Payment verified. Premium access updated."
              : verifyPayload.error ?? "Payment verification failed."
          );
        }
      });

      setLoading(false);
      checkout.open();
    } catch {
      setLoading(false);
      setMessage("Could not start checkout. Please try again.");
    }
  }

  return (
    <Card className={premium ? "glass-panel neon-bloom-primary border-primary/40" : "glass-panel"}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{plan}</CardTitle>
          {premium ? (
            <Badge>
              <Crown className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          ) : null}
        </div>
        <p className="text-3xl font-black text-white">{price}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {feature}
            </div>
          ))}
        </div>
        {premium && !authenticated ? (
          <Button asChild className="w-full">
            <Link href="/auth?next=/pricing">
              <Crown className="h-4 w-4" />
              Log in to start premium
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={premium ? "default" : "outline"}
            onClick={startCheckout}
            disabled={loading || !premium}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : premium ? (
              <Crown className="h-4 w-4" />
            ) : null}
            {premium ? "Start premium" : "Current free plan"}
          </Button>
        )}
        {message ? <p className="text-sm text-orange-100">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
