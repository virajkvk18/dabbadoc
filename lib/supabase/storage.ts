import "server-only";

import { slugify } from "@/lib/utils";
import { ApiError } from "@/lib/security/api-errors";
import { uploadImageToCloudinary } from "@/lib/cloudinary/storage";
import { createSupabaseAdmin } from "./admin";

export const BUCKET_NAME = "dabbadoc-uploads";

export async function uploadToStorage(params: {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  if (!params.userId) {
    throw new ApiError("Authenticated user is required.", 401);
  }

  if (params.mimeType.startsWith("image/")) {
    try {
      const cloudinaryUpload = await uploadImageToCloudinary(params);
      if (cloudinaryUpload) return cloudinaryUpload;
    } catch {
      // Fall back to Supabase Storage so scans still work if Cloudinary is temporarily unavailable.
    }
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

export async function downloadFromStorage(path: string) {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new ApiError("Upload storage is temporarily unavailable.", 503);
  }

  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);
  if (error || !data) {
    throw new ApiError("Could not read uploaded image from storage.", 400);
  }

  return Buffer.from(await data.arrayBuffer());
}
