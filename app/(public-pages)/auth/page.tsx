import { AuthPanel } from "@/components/auth/auth-panel";
import { Disclaimer } from "@/components/common/disclaimer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";

type AuthPageProps = {
  searchParams?: Promise<{
    next?: string;
    reason?: string;
    error?: string;
  }>;
};

function safeNext(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="bg-grid-pattern px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <Badge variant="secondary">Account access</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Continue your food health journey
          </h1>
          <p className="mt-3 text-muted-foreground">
            Save analysis history, streaks, badges, premium status, and reports.
          </p>
        </div>
        <AuthPanel nextPath={safeNext(params?.next)} reason={params?.reason ?? params?.error} />
        <div className="mx-auto mt-6 max-w-md">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
