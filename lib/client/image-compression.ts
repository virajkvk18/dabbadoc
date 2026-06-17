"use client";

export type CompressionResult = {
  file: File;
  originalSize: number;
  compressed: boolean;
};

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.72;
const TARGET_BYTES = 2.4 * 1024 * 1024;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

function compressedName(fileName: string) {
  return `${fileName.replace(/\.[^.]+$/, "") || "capture"}-compressed.jpg`;
}

export async function compressImageForUpload(file: File): Promise<CompressionResult> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return { file, originalSize: file.size, compressed: false };
  }

  const image = await loadImage(file);
  const scale = Math.min(1, DEFAULT_MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return { file, originalSize: file.size, compressed: false };

  context.drawImage(image, 0, 0, width, height);

  let quality = DEFAULT_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob && blob.size > TARGET_BYTES && quality > 0.42) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  if (!blob || blob.size >= file.size) {
    return { file, originalSize: file.size, compressed: false };
  }

  return {
    file: new File([blob], compressedName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now()
    }),
    originalSize: file.size,
    compressed: true
  };
}

export function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
