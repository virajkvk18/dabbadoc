import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractLabelText,
  LabelExtractionError
} from "@/lib/agents/labelScanAgent";
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
import { labelAnalyzeSchema } from "@/lib/validators/api";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceAiGenerationRateLimit(request, user.id, "label-ocr");
    enforceRequestSizeLimit(
      request,
      MAX_UPLOAD_BYTES,
      "Label image must be smaller before OCR."
    );

    const formData = await request.formData();
    const file = formData.get("file");
    const storagePath = formData.get("storagePath");
    const parsed = labelAnalyzeSchema.parse({
      demoMode: formData.get("demoMode") === "true"
    });

    if (!parsed.demoMode && !(file instanceof File) && typeof storagePath !== "string") {
      throw new ApiError("Please upload a label image before extracting text.", 400);
    }

    let dataUri: string | undefined;
    let fileName = "demo-label.jpg";
    let mimeType = "image/jpeg";

    if (file instanceof File) {
      enforceUploadFileType(file);
      const buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
      mimeType = file.type || "application/octet-stream";
      dataUri = toDataUri(buffer, mimeType);
    } else if (typeof storagePath === "string" && storagePath.startsWith(`${user.id}/`)) {
      const buffer = await downloadFromStorage(storagePath);
      fileName = String(formData.get("fileName") || "stored-label.jpg");
      mimeType = String(formData.get("mimeType") || "image/jpeg");
      dataUri = toDataUri(buffer, mimeType);
    } else if (typeof storagePath === "string") {
      throw new ApiError("Stored image path is not allowed for this account.", 403);
    }

    const extractedText = await extractLabelText({
      userId: user.id,
      sourceType: "packaged_label",
      fileName,
      mimeType,
      dataUri,
      demoMode: parsed.demoMode
    });

    return NextResponse.json({ extractedText });
  } catch (error) {
    if (error instanceof LabelExtractionError) {
      return apiErrorResponse(new ApiError(error.message, 422), "Label OCR failed", 422, {
        request,
        route: "/api/extract-label"
      });
    }

    return apiErrorResponse(error, "Label OCR failed", 400, {
      request,
      route: "/api/extract-label"
    });
  }
}
