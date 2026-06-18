import { ScanLine } from "lucide-react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { LabelScanForm } from "@/components/upload/label-scan-form";

export default function LabelScanPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Label truth"
        title="Packaged Food LabelScan"
        description="Scan nutrition and ingredient labels for hidden sugar, sodium, oils, maida, and additive signals."
        icon={ScanLine}
      />
      <LabelScanForm />
    </div>
  );
}
