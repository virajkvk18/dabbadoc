import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { slugify } from "@/lib/utils";

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  return cloudinary;
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export async function uploadImageToCloudinary(params: {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const client = cloudinaryConfig();
  if (!client || !params.mimeType.startsWith("image/")) return null;

  const safeName = slugify(params.fileName.replace(/\.[^.]+$/, "")) || "upload";
  const publicId = `${Date.now()}-${safeName}`;
  const folder = `dabbadoc/uploads/${params.userId}`;

  return new Promise<{
    fileUrl: string;
    path: string;
    publicId: string;
    skipped: false;
  }>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
        use_filename: false,
        unique_filename: false,
        context: {
          app: "DabbaDoc",
          user_id: params.userId,
          original_file_name: params.fileName
        }
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        const upload = result as CloudinaryUploadResult;
        resolve({
          fileUrl: upload.secure_url,
          path: `cloudinary://${upload.public_id}`,
          publicId: upload.public_id,
          skipped: false
        });
      }
    );

    stream.end(params.buffer);
  });
}
