import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractReceiptText,
  ReceiptExtractionError
} from "@/lib/agents/receiptScanAgent";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { ApiError, apiErrorResponse } from "@/lib/security/api-errors";
import {
  enforceAiGenerationRateLimit,
  enforceRequestSizeLimit,
  enforceUploadFileType,
  MAX_UPLOAD_BYTES
} from "@/lib/security/abuse-protection";
import { downloadFromStorage } from "@/lib/supabase/storage";
import { toDataUri } from "@/lib/utils";
import { receiptAnalyzeSchema } from "@/lib/validators/api";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceAiGenerationRateLimit(request, user.id, "receipt-ocr");
    enforceRequestSizeLimit(
      request,
      MAX_UPLOAD_BYTES,
      "Receipt image must be smaller before OCR."
    );

    const formData = await request.formData();
    const file = formData.get("file");
    const storagePath = formData.get("storagePath");
    const parsed = receiptAnalyzeSchema.parse({
      sourceType: formData.get("sourceType") ?? "grocery_receipt",
      demoMode: formData.get("demoMode") === "true"
    });

    if (!parsed.demoMode && !(file instanceof File) && typeof storagePath !== "string") {
      throw new ApiError("Please upload a receipt image before extracting text.", 400);
    }

    let dataUri: string | undefined;
    let fileName = "demo-receipt.jpg";
    let mimeType = "image/jpeg";

    if (file instanceof File) {
      enforceUploadFileType(file);
      const buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
      mimeType = file.type || "application/octet-stream";
      dataUri = toDataUri(buffer, mimeType);
    } else if (typeof storagePath === "string" && storagePath.startsWith(`${user.id}/`)) {
      const buffer = await downloadFromStorage(storagePath);
      fileName = String(formData.get("fileName") || "stored-receipt.jpg");
      mimeType = String(formData.get("mimeType") || "image/jpeg");
      dataUri = toDataUri(buffer, mimeType);
    } else if (typeof storagePath === "string") {
      throw new ApiError("Stored image path is not allowed for this account.", 403);
    }

    const extractedText = await extractReceiptText({
      userId: user.id,
      sourceType: parsed.sourceType,
      fileName,
      mimeType,
      dataUri,
      demoMode: parsed.demoMode
    });

    return NextResponse.json({ extractedText });
  } catch (error) {
    if (error instanceof ReceiptExtractionError) {
      return apiErrorResponse(new ApiError(error.message, 422), "Receipt OCR failed", 422, {
        request,
        route: "/api/extract-receipt"
      });
    }

    return apiErrorResponse(error, "Receipt OCR failed", 400, {
      request,
      route: "/api/extract-receipt"
    });
  }
}
