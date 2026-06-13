import { UpdatePasswordPanel } from "@/components/auth/update-password-panel";
import { Disclaimer } from "@/components/common/disclaimer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="bg-grid-pattern px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <Badge variant="secondary">Password reset</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Set your new password
          </h1>
          <p className="mt-3 text-muted-foreground">
            Reset links are single-use and expire based on your account security settings.
          </p>
        </div>
        <UpdatePasswordPanel />
        <div className="mx-auto mt-6 max-w-md">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
