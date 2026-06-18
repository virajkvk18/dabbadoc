"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const relationships = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandparent",
  "Other"
];

type ApiResponse = {
  error?: string;
  message?: string;
};

export function FamilyInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("Father");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, relationship })
      });
      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok) {
        setError(payload.error ?? "Could not create invite.");
        return;
      }
      setEmail("");
      setMessage(payload.message ?? "Family invite created.");
      router.refresh();
    } catch {
      setError("Could not create invite. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <div className="space-y-2">
          <Label htmlFor="family-email">Email address</Label>
          <Input
            id="family-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="family@example.com"
            type="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="family-relationship">Relationship</Label>
          <select
            id="family-relationship"
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            className="flex h-11 w-full rounded-xl border border-white/10 bg-[#0a0e16]/80 px-3 py-2 text-sm text-white focus-visible:border-primary/70 focus-visible:outline-none"
          >
            {relationships.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Add Family Member
          </Button>
        </div>
      </div>
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}

export function InviteResponseButtons({ connectionId }: { connectionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "reject") {
    setLoading(action);
    setError(null);
    try {
      const response = await fetch("/api/family/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action })
      });
      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok) {
        setError(payload.error ?? "Could not update invite.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update invite. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => respond("accept")} disabled={Boolean(loading)}>
          {loading === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={() => respond("reject")} disabled={Boolean(loading)}>
          {loading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Reject
        </Button>
      </div>
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}

export function RemoveFamilyConnectionButton({ connectionId }: { connectionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/family/${connectionId}`, {
        method: "DELETE"
      });
      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok) {
        setError(payload.error ?? "Could not remove connection.");
        return;
      }
      router.push("/dashboard/family");
      router.refresh();
    } catch {
      setError("Could not remove connection. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={remove} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Remove access
      </Button>
      {error ? <p className="text-xs text-red-200">{error}</p> : null}
    </div>
  );
}
