"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, LogIn, Mail, ShieldCheck, User, UserPlus } from "lucide-react";
import { DabbaDocLogo } from "@/components/brand/dabbadoc-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function friendlyAuthMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Secure account access is temporarily unavailable.";
  }

  const hiddenWords = ["supabase", ".env", "environment", "configured", "key"];
  if (hiddenWords.some((word) => error.message.toLowerCase().includes(word))) {
    return "Secure account access is temporarily unavailable.";
  }

  return error.message;
}

type AuthPanelProps = {
  nextPath?: string;
  reason?: string;
};

type AuthMode = "login" | "signup" | "reset";

function reasonMessage(reason?: string) {
  if (reason === "session_expired") return "Your session expired. Please log in again.";
  if (reason === "email_unverified") return "Verify your email before accessing your account.";
  if (reason === "unavailable") return "Secure account access is temporarily unavailable.";
  return null;
}

export function AuthPanel({ nextPath = "/dashboard", reason }: AuthPanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(reasonMessage(reason));
  const [loading, setLoading] = useState(false);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const endpoint =
        mode === "signup"
          ? "/api/auth/signup"
          : mode === "reset"
            ? "/api/auth/reset-password"
            : "/api/auth/login";
      const body =
        mode === "reset"
          ? { email }
          : {
              email,
              password,
              fullName,
              next: nextPath
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        next?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not complete secure account request.");
      }

      if (mode === "login") {
        router.replace(payload.next ?? nextPath);
        router.refresh();
        return;
      }

      setPassword("");
      setMessage(payload.message ?? "Request complete.");
    } catch (error) {
      setMessage(friendlyAuthMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="glass-panel neon-bloom-primary mx-auto max-w-md overflow-hidden">
      <CardHeader className="items-center text-center">
        <DabbaDocLogo size="lg" showText={false} />
        <CardTitle className="mt-3">
          {mode === "login"
            ? "Secure login"
            : mode === "signup"
              ? "Create account"
              : "Reset password"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Save scans, streaks, reports, and family food history.
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
              mode === "login"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
              mode === "signup"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Sign up
          </button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
        {mode === "signup" ? (
          <div className="space-y-2">
            <Label htmlFor="full-name" className="mono-label text-[11px] text-muted-foreground">
              Full name
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="full-name"
                value={fullName}
                className="pl-10"
                placeholder="Demo Family"
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email" className="mono-label text-[11px] text-muted-foreground">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              className="pl-10"
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>
        {mode !== "reset" ? (
          <div className="space-y-2">
            <Label htmlFor="password" className="mono-label text-[11px] text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                className="pl-10"
                placeholder={
                  mode === "signup"
                    ? "12+ chars, upper, lower, number, symbol"
                    : "Your password"
                }
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-secondary/25 bg-secondary/10 p-3 text-sm text-orange-100">
            {message}
          </p>
        ) : null}
        <div className="grid gap-3">
          <Button type="submit" disabled={loading}>
            {mode === "login" ? (
              <LogIn className="h-4 w-4" />
            ) : mode === "signup" ? (
              <UserPlus className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {loading
              ? "Working..."
              : mode === "login"
                ? "Login"
                : mode === "signup"
                  ? "Sign up"
                  : "Send reset link"}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
          {mode === "login" ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode("reset");
                setMessage(null);
              }}
            >
              Forgot password?
            </Button>
          ) : mode === "reset" ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
            >
              Back to login
            </Button>
          ) : null}
          <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Your food history stays private to your account.
          </p>
        </div>
        </form>
      </CardContent>
    </Card>
  );
}
