import { AppLoadingShell } from "@/components/common/app-loading-shell";
import { SiteHeader } from "@/components/layout/site-header";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <AppLoadingShell label="Loading account settings" />
      </main>
    </div>
  );
}
