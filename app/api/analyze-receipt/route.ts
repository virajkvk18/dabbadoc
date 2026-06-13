import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runReceiptGraph } from "@/lib/agents/graph";
import { ReceiptExtractionError } from "@/lib/agents/receiptScanAgent";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { ApiError, apiErrorResponse } from "@/lib/security/api-errors";
import {
  enforceAiGenerationRateLimit,
  enforceRequestSizeLimit,
  MAX_UPLOAD_BYTES
} from "@/lib/security/abuse-protection";
import { saveReceiptAnalysis, saveUploadRecord } from "@/lib/supabase/mutations";
import { uploadToStorage } from "@/lib/supabase/storage";
import { toDataUri } from "@/lib/utils";
import { receiptAnalyzeSchema } from "@/lib/validators/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceAiGenerationRateLimit(request, user.id, "receipt");
    enforceRequestSizeLimit(
      request,
      MAX_UPLOAD_BYTES,
      "Receipt upload must be 12 MB or smaller."
    );

    const formData = await request.formData();
    const file = formData.get("file");
    const parsed = receiptAnalyzeSchema.parse({
      sourceType: formData.get("sourceType") ?? "grocery_receipt",
      demoMode: formData.get("demoMode") === "true"
    });
    if (!parsed.demoMode && !(file instanceof File)) {
      throw new ApiError("Please upload a receipt image before analyzing.", 400);
    }

    let dataUri: string | undefined;
    let fileUrl: string | null = null;
    let fileName = "demo-receipt.jpg";
    let mimeType = "image/jpeg";

    if (file instanceof File) {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new ApiError("Receipt upload must be 12 MB or smaller.", 413);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
      mimeType = file.type || "application/octet-stream";
      dataUri = toDataUri(buffer, mimeType);

      const upload = await uploadToStorage({
        userId: user.id,
        fileName,
        mimeType,
        buffer
      });
      fileUrl = upload.path;
    }

    const analysis = await runReceiptGraph({
      userId: user.id,
      sourceType: parsed.sourceType,
      fileName,
      mimeType,
      dataUri,
      demoMode: parsed.demoMode
    });

    let saved = false;
    try {
      const uploadId = await saveUploadRecord({
        userId: user.id,
        fileUrl,
        fileType: mimeType,
        sourceType: parsed.sourceType
      });

      await saveReceiptAnalysis({
        userId: user.id,
        uploadId,
        analysis
      });
      saved = true;
    } catch {
      saved = false;
    }

    return NextResponse.json({
      analysis,
      saved,
      warning: saved
        ? undefined
        : "Analysis completed, but history could not be saved yet. Check Supabase tables and policies."
    });
  } catch (error) {
    if (error instanceof ReceiptExtractionError) {
      return apiErrorResponse(new ApiError(error.message, 422), "Receipt analysis failed", 422, {
        request,
        route: "/api/analyze-receipt"
      });
    }

    return apiErrorResponse(error, "Receipt analysis failed", 400, {
      request,
      route: "/api/analyze-receipt"
    });
  }
}
