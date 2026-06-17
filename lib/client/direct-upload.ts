"use client";

import { createSupabaseBrowser } from "@/lib/supabase/client";

const BUCKET_NAME = "dabbadoc-uploads";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type DirectUploadResult = {
  path: string;
  fileName: string;
  mimeType: string;
};

export async function uploadImageDirectly(file: File): Promise<DirectUploadResult> {
  const supabase = createSupabaseBrowser();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Please log in again before uploading.");
  }

  const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "capture";
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false
  });

  if (error) {
    throw new Error(error.message || "Could not upload image to storage.");
  }

  return {
    path,
    fileName: file.name,
    mimeType: file.type || "image/jpeg"
  };
}
