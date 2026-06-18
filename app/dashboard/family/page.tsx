import Link from "next/link";
import { ArrowRight, HeartPulse, UsersRound } from "lucide-react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FamilyInviteForm,
  InviteResponseButtons
} from "@/components/family/family-actions";
import { getFamilyOverview } from "@/lib/supabase/family";

const statusTone = {
  pending: "border-secondary/30 bg-secondary/10 text-orange-100",
  accepted: "border-primary/30 bg-primary/10 text-primary",
  rejected: "border-red-400/25 bg-red-500/10 text-red-100",
  revoked: "border-white/10 bg-white/5 text-muted-foreground"
};

export default async function FamilyPage() {
  const family = await getFamilyOverview().catch(() => null);
  if (!family) {
    return (
      <div className="space-y-6">
        <AppPageHeader
          eyebrow="Read-only family view"
          title="Family Members"
          description="Connect independent DabbaDoc accounts and view concise health summaries without editing their private records."
          icon={UsersRound}
          accent="primary"
          stats={[
            { label: "Connected", value: "--" },
            { label: "Pending", value: "--" },
            { label: "Access", value: "Read-only" }
          ]}
        />
        <Card className="glass-panel">
          <CardContent className="p-6">
            <p className="font-semibold text-white">Family setup is pending</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The Family feature needs the latest Supabase database migration before it can load members.
              Apply the updated schema and policies, then refresh this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const acceptedCount = family.members.filter((member) => member.status === "accepted").length;

  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Read-only family view"
        title="Family Members"
        description="Connect independent DabbaDoc accounts and view concise health summaries without editing their private records."
        icon={UsersRound}
        accent="primary"
        stats={[
          { label: "Connected", value: `${acceptedCount}` },
          { label: "Pending", value: `${family.members.length - acceptedCount}` },
          { label: "Access", value: "Read-only" }
        ]}
      />

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>+ Add Family Member</CardTitle>
        </CardHeader>
        <CardContent>
          <FamilyInviteForm />
        </CardContent>
      </Card>

      {family.incomingInvites.length > 0 ? (
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Pending invites for you</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {family.incomingInvites.map((invite) => (
              <div key={invite.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">{invite.relationship} connection request</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This account wants read-only access to your DabbaDoc summary.
                </p>
                <div className="mt-3">
                  <InviteResponseButtons connectionId={invite.id} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {family.members.length === 0 ? (
          <Card className="glass-panel md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center">
              <p className="font-semibold text-white">No family members connected yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a family member by email. They keep their own account and can accept or reject access.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {family.members.map((member) => {
          const card = (
            <Card className="glass-panel h-full transition hover:border-primary/30">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-lg font-black text-primary">
                      {member.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.relationship}</p>
                    </div>
                  </div>
                  <Badge className={statusTone[member.status]}>
                    {member.status}
                  </Badge>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="mono-label text-[10px] text-muted-foreground">Health Score</p>
                    <p className="mt-1 text-2xl font-black text-white">
                      {member.healthScore ?? "--"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="mono-label text-[10px] text-muted-foreground">Last Updated</p>
                    <p className="mt-1 text-sm font-bold text-white">{member.lastUpdatedLabel}</p>
                  </div>
                </div>
                {member.status === "accepted" ? (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                    View summary <ArrowRight className="h-4 w-4" />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Waiting for this family member to accept the invite.
                  </p>
                )}
              </CardContent>
            </Card>
          );

          return member.status === "accepted" ? (
            <Link key={member.id} href={`/dashboard/family/${member.id}`}>
              {card}
            </Link>
          ) : (
            <div key={member.id}>{card}</div>
          );
        })}
      </div>

      <Card className="glass-panel">
        <CardContent className="flex items-start gap-3 p-5">
          <HeartPulse className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            Family access is summary-only. Connected users keep separate accounts, separate settings, and full control of their own records.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
