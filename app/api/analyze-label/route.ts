import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { analyzeLabelWithDabbaAgent } from "@/lib/agents/dabbaAgentClient";
import {
  analyzeLabel,
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
import { getHealthContextForUser } from "@/lib/supabase/health-profile";
import { saveLabelAnalysis, saveUploadRecord } from "@/lib/supabase/mutations";
import { downloadFromStorage, uploadToStorage } from "@/lib/supabase/storage";
import { toDataUri } from "@/lib/utils";
import { labelAnalyzeSchema } from "@/lib/validators/api";

export const runtime = "nodejs";
export const maxDuration = 60;

function optionalFormString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

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
    const storagePath = formData.get("storagePath");
    const parsed = labelAnalyzeSchema.parse({
      demoMode: formData.get("demoMode") === "true",
      productName: optionalFormString(formData.get("productName")),
      rawText: optionalFormString(formData.get("rawText")),
      healthGoals: formData.getAll("healthGoals")
    });
    if (!parsed.demoMode && !parsed.rawText && !(file instanceof File) && typeof storagePath !== "string") {
      throw new ApiError("Please upload a label image or reviewed label text before analyzing.", 400);
    }

    let dataUri: string | undefined;
    let fileUrl: string | null = null;
    let fileName = "demo-label.jpg";
    let mimeType = "image/jpeg";

    if (file instanceof File) {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new ApiError("Label upload must be 12 MB or smaller.", 413);
      }
      enforceUploadFileType(file);

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
      fileUrl = upload.fileUrl ?? upload.path;
    } else if (typeof storagePath === "string" && storagePath.startsWith(`${user.id}/`)) {
      fileName = String(formData.get("fileName") || "stored-label.jpg");
      mimeType = String(formData.get("mimeType") || "image/jpeg");
      const buffer = await downloadFromStorage(storagePath);
      const upload = await uploadToStorage({
        userId: user.id,
        fileName,
        mimeType,
        buffer
      });
      fileUrl = upload.fileUrl ?? storagePath;
    } else if (typeof storagePath === "string") {
      throw new ApiError("Stored image path is not allowed for this account.", 403);
    }

    const healthContext = await getHealthContextForUser(user.id);
    const healthGoals = Array.from(new Set([...healthContext.goals, ...parsed.healthGoals]));
    const agentInput = {
      userId: user.id,
      sourceType: "packaged_label",
      fileName,
      mimeType,
      dataUri,
      demoMode: parsed.demoMode,
      rawText: parsed.rawText,
      productName: parsed.productName,
      healthGoals,
      healthContext: healthContext.context
    } as const;
    const extractedText = await extractLabelText(agentInput);
    const analysis =
      (await analyzeLabelWithDabbaAgent({
        rawText: extractedText,
        productName:
          parsed.productName ||
          extractedText.split("\n").find(Boolean)?.trim(),
        healthGoals,
        healthContext: healthContext.context
      })) ??
      (await analyzeLabel({
        ...agentInput,
        rawText: extractedText,
        dataUri: undefined
      }));

    let saved = false;
    try {
      const uploadId = await saveUploadRecord({
        userId: user.id,
        fileUrl,
        fileType: mimeType,
        sourceType: "packaged_label"
      });

      await saveLabelAnalysis({
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
    if (error instanceof LabelExtractionError) {
      return apiErrorResponse(new ApiError(error.message, 422), "Label analysis failed", 422, {
        request,
        route: "/api/analyze-label"
      });
    }

    return apiErrorResponse(error, "Label analysis failed", 400, {
      request,
      route: "/api/analyze-label"
    });
  }
}
