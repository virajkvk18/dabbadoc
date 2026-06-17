import "server-only";

import { slugify } from "@/lib/utils";
import { ApiError } from "@/lib/security/api-errors";
import { createSupabaseAdmin } from "./admin";

const BUCKET_NAME = "dabbadoc-uploads";

export async function uploadToStorage(params: {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  if (!params.userId) {
    throw new ApiError("Authenticated user is required.", 401);
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return {
      fileUrl: null,
      path: null,
      skipped: true
    };
  }

  const safeName = slugify(params.fileName.replace(/\.[^.]+$/, "")) || "upload";
  const ext =
    params.fileName
      .split(".")
      .pop()
      ?.replace(/[^a-z0-9]/gi, "")
      .slice(0, 8)
      .toLowerCase() || "bin";
  const path = `${params.userId}/${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, params.buffer, {
      contentType: params.mimeType,
      upsert: false
    });

  if (error) {
    return {
      fileUrl: null,
      path,
      skipped: true,
      error: error.message
    };
  }

  return {
    fileUrl: null,
    path,
    skipped: false
  };
}
