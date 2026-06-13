import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { analyzeLabel } from "@/lib/agents/labelScanAgent";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { ApiError, apiErrorResponse } from "@/lib/security/api-errors";
import {
  enforceAiGenerationRateLimit,
  enforceRequestSizeLimit,
  MAX_UPLOAD_BYTES
} from "@/lib/security/abuse-protection";
import { saveLabelAnalysis, saveUploadRecord } from "@/lib/supabase/mutations";
import { uploadToStorage } from "@/lib/supabase/storage";
import { toDataUri } from "@/lib/utils";
import { labelAnalyzeSchema } from "@/lib/validators/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceAiGenerationRateLimit(request, user.id, "label");
    enforceRequestSizeLimit(
      request,
      MAX_UPLOAD_BYTES,
      "Label upload must be 12 MB or smaller."
    );

    const formData = await request.formData();
    const file = formData.get("file");
    const parsed = labelAnalyzeSchema.parse({
      demoMode: formData.get("demoMode") === "true"
    });

    let dataUri: string | undefined;
    let fileUrl: string | null = null;
    let fileName = "demo-label.jpg";
    let mimeType = "image/jpeg";

    if (file instanceof File) {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new ApiError("Label upload must be 12 MB or smaller.", 413);
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
      sourceType: "packaged_label"
    });

    const analysis = await analyzeLabel({
      userId: user.id,
      sourceType: "packaged_label",
      fileName,
      mimeType,
      dataUri,
      demoMode: parsed.demoMode || !file
    });

    await saveLabelAnalysis({
      userId: user.id,
      uploadId,
      analysis
    });

    return NextResponse.json({ analysis, saved: true });
  } catch (error) {
    return apiErrorResponse(error, "Label analysis failed", 400, {
      request,
      route: "/api/analyze-label"
    });
  }
}
