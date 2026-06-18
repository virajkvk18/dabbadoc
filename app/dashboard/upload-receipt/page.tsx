import { ReceiptText } from "lucide-react";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { ReceiptUploadForm } from "@/components/upload/receipt-upload-form";

export default function UploadReceiptPage() {
  return (
    <div className="space-y-6">
      <AppPageHeader
        eyebrow="Receipt intelligence"
        title="Receipt / order scanner"
        description="Analyze grocery receipts, food delivery bills, quick-commerce screenshots, or demo data."
        icon={ReceiptText}
      />
      <ReceiptUploadForm />
    </div>
  );
}
