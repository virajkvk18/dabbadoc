import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runReceiptGraph } from "@/lib/agents/graph";
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

    const uploadId = await saveUploadRecord({
      userId: user.id,
      fileUrl,
      fileType: mimeType,
      sourceType: parsed.sourceType
    });

    const analysis = await runReceiptGraph({
      userId: user.id,
      sourceType: parsed.sourceType,
      fileName,
      mimeType,
      dataUri,
      demoMode: parsed.demoMode || !file
    });

    await saveReceiptAnalysis({
      userId: user.id,
      uploadId,
      analysis
    });

    return NextResponse.json({ analysis, saved: true });
  } catch (error) {
    return apiErrorResponse(error, "Receipt analysis failed", 400, {
      request,
      route: "/api/analyze-receipt"
    });
  }
}
