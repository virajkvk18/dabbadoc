import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function MyDiaryLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
