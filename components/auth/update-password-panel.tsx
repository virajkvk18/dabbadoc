"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdatePasswordPanel() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        next?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update password.");
      }

      setPassword("");
      setMessage(payload.message ?? "Password updated.");
      router.replace(payload.next ?? "/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glass-panel neon-bloom-primary mx-auto max-w-md overflow-hidden">
      <CardHeader className="items-center text-center">
        <DabbaDocLogo size="lg" showText={false} />
        <CardTitle className="mt-3">Create a new password</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use a strong password that you do not reuse on other websites.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="mono-label text-[11px] text-muted-foreground">
              New password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                value={password}
                className="pl-10"
                placeholder="12+ chars, upper, lower, number, symbol"
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>
          {message ? (
            <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-3 text-sm text-orange-100">
              {message}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            <ShieldCheck className="h-4 w-4" />
            {loading ? "Updating..." : "Update password"}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
