import { Barcode } from "lucide-react";
import { BarcodeScanPanel } from "@/components/barcode/barcode-scan-panel";
import { AppPageHeader } from "@/components/layout/app-page-header";

export default function BarcodeScanPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Packaged foods"
        title="Barcode Scan"
        description="Scan or enter packaged-food barcodes to fetch product, ingredient, and nutrition details."
        icon={Barcode}
      />
      <BarcodeScanPanel />
    </div>
  );
}
