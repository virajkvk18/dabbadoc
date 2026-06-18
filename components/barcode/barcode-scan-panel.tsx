"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Barcode, FileImage, Loader2, ScanLine } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BarcodeResponse = {
  barcode?: string;
  productName?: string;
  labelText?: string;
  error?: string;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

type WindowWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

function getBarcodeReader() {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);

  return new BrowserMultiFormatReader(hints);
}

function cleanDetectedBarcode(value: string) {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue.length >= 8 && cleanValue.length <= 14 ? cleanValue : "";
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not load"));
    image.src = url;
  });
}

function createScanCanvas(image: HTMLImageElement, rotation: number, highContrast: boolean) {
  const maxSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = maxSide > 2200 ? 2200 / maxSide : maxSide < 900 ? 900 / maxSide : 1;
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const quarterTurn = rotation === 90 || rotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = quarterTurn ? height : width;
  canvas.height = quarterTurn ? width : height;

  const context = canvas.getContext("2d", { willReadFrequently: highContrast });
  if (!context) {
    throw new Error("Could not prepare barcode image");
  }

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -width / 2, -height / 2, width, height);

  if (highContrast) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let index = 0; index < data.length; index += 4) {
      const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      const value = gray < 145 ? 0 : 255;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
    }
    context.putImageData(imageData, 0, 0);
  }

  return canvas;
}

async function decodeBarcodeWithZxing(file: File) {
  const reader = getBarcodeReader();
  const url = URL.createObjectURL(file);

  try {
    try {
      const result = await reader.decodeFromImageUrl(url);
      const detected = cleanDetectedBarcode(result.getText());
      if (detected) return detected;
    } catch {
      // Continue with canvas-based attempts below.
    }

    const image = await loadImage(url);
    const rotations = [0, 90, 180, 270];
    const highContrastModes = [false, true];

    for (const highContrast of highContrastModes) {
      for (const rotation of rotations) {
        try {
          const canvas = createScanCanvas(image, rotation, highContrast);
          const result = reader.decodeFromCanvas(canvas);
          const detected = cleanDetectedBarcode(result.getText());
          if (detected) return detected;
        } catch {
          // Try the next image variant.
        }
      }
    }

    return "";
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function BarcodeScanPanel() {
  const [barcode, setBarcode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [labelText, setLabelText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function lookupBarcode(nextBarcode = barcode) {
    const cleanBarcode = nextBarcode.replace(/\D/g, "");
    if (!cleanBarcode) {
      setError("Enter or scan a barcode first.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/barcode-product?barcode=${encodeURIComponent(cleanBarcode)}`);
      const payload = (await response.json().catch(() => ({}))) as BarcodeResponse;

      if (!response.ok || !payload.labelText) {
        setError(payload.error ?? "Product not found. Try a clearer barcode or enter label text in LabelScan.");
        return;
      }

      setBarcode(payload.barcode ?? cleanBarcode);
      setProductName(payload.productName ?? "Packaged food");
      setLabelText(payload.labelText);
      setMessage("Product details fetched. You can review this before using LabelScan.");
    } catch {
      setError("Could not fetch barcode details. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function detectBarcodeFromImage() {
    if (!file) {
      setError("Capture or upload a barcode image first.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let detected = "";
      const Detector = (window as WindowWithBarcodeDetector).BarcodeDetector;

      if (Detector) {
        const bitmap = await createImageBitmap(file);
        const detector = new Detector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"]
        });
        const codes = await detector.detect(bitmap);
        bitmap.close();
        detected = codes[0]?.rawValue?.replace(/\D/g, "") ?? "";
      }

      if (!detected) {
        detected = await decodeBarcodeWithZxing(file);
      }

      if (!detected) {
        setError("No barcode detected. Crop closer to the barcode, keep it straight, or enter the number manually.");
        return;
      }

      await lookupBarcode(detected);
    } catch {
      setError("Could not scan barcode from this image. Enter the barcode number manually.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,520px)_1fr]">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Scan packaged food barcode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="scan-frame rounded-2xl border border-dashed border-primary/30 bg-white/5 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label>Barcode image</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture the barcode side of the packet or upload a saved photo.
                </p>
              </div>
              <label
                htmlFor="barcode-image"
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(129,247,89,0.28)] transition hover:bg-[#86fd5e]"
              >
                <FileImage className="h-4 w-4" />
                Choose image
              </label>
            </div>
            <Input
              id="barcode-image"
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
                setMessage(null);
              }}
            />
            {file ? (
              <div className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[120px_1fr]">
                <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-white/5">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Selected barcode preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 self-center">
                  <p className="truncate font-semibold text-white">{file.name}</p>
                  <p className="text-sm text-muted-foreground">Ready to scan from image</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode-number">Barcode number</Label>
            <Input
              id="barcode-number"
              value={barcode}
              onChange={(event) => {
                setBarcode(event.target.value.replace(/\D/g, ""));
                setError(null);
                setMessage(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void lookupBarcode();
                }
              }}
              placeholder="Enter barcode number"
              inputMode="numeric"
            />
          </div>

          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          {message ? <p className="text-sm text-primary">{message}</p> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={() => lookupBarcode()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Barcode className="h-4 w-4" />}
              Lookup barcode
            </Button>
            <Button type="button" variant="outline" onClick={detectBarcodeFromImage} disabled={loading || !file}>
              <ScanLine className="h-4 w-4" />
              Scan image
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>{productName ?? "Product details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={labelText}
            onChange={(event) => setLabelText(event.target.value)}
            placeholder="Fetched ingredients and nutrition details will appear here after barcode lookup."
            className="min-h-[320px]"
          />
          <p className="text-sm text-muted-foreground">
            Use this as packaged-food reference data. For full health scoring, paste or capture the label in LabelScan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
