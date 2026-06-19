"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Camera, FileImage, Loader2, PlayCircle, Upload } from "lucide-react";
import { Disclaimer } from "@/components/common/disclaimer";
import { ProcessingSteps } from "@/components/common/processing-steps";
import {
  CostSummary,
  DetectedItems,
  ExtractedReceiptText,
  FutureHealthRisks,
  ItemInsightList,
  BudgetHealthCombo,
  ReceiptCoverage,
  RiskFlags,
  SmartGroceryList,
  SwapList
} from "@/components/upload/analysis-list";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageDirectly } from "@/lib/client/direct-upload";
import type { DirectUploadResult } from "@/lib/client/direct-upload";
import { compressImageForUpload, formatFileSize } from "@/lib/client/image-compression";
import { HealthGoalSelector } from "@/components/upload/health-goal-selector";
import { ScanGuide } from "@/components/upload/scan-guide";
import type { ReceiptAnalysis, SourceType } from "@/types";

type ReceiptResponse = {
  analysis: ReceiptAnalysis;
  saved: boolean;
  warning?: string;
  error?: string;
};

type ExtractResponse = {
  extractedText?: string;
  error?: string;
};

type ExtractResult = {
  text: string;
  upload: DirectUploadResult | null;
};

const ANALYSIS_TIMEOUT_MS = 70_000;
const DIRECT_UPLOAD_THRESHOLD_BYTES = 3.8 * 1024 * 1024;

export function ReceiptUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [directUpload, setDirectUpload] = useState<DirectUploadResult | null>(null);
  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<Extract<SourceType, "grocery_receipt" | "food_delivery" | "quick_commerce">>("grocery_receipt");

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function chooseFile(nextFile?: File | null) {
    setError(null);
    setWarning(null);
    setAnalysis(null);
    setOcrText("");
    setOriginalSize(null);
    setDirectUpload(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    setProcessingFile(true);
    try {
      const result = await compressImageForUpload(nextFile);
      setFile(result.file);
      setOriginalSize(result.compressed ? result.originalSize : null);
      if (result.compressed) {
        setWarning(
          `Image compressed from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.file.size)} for faster upload.`
        );
      }
    } catch {
      setFile(nextFile);
      setError("Could not compress this image. Try uploading a JPG or PNG.");
    } finally {
      setProcessingFile(false);
    }
  }

  async function extractText(): Promise<ExtractResult | null> {
    if (!file) {
      setError("Choose a receipt image or use live capture before extracting text.");
      setWarning(null);
      return null;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.set("sourceType", sourceType);
      formData.set("demoMode", "false");
      let uploadedFile: DirectUploadResult | null = null;
      if (file.size > DIRECT_UPLOAD_THRESHOLD_BYTES) {
        const upload = await uploadImageDirectly(file);
        uploadedFile = upload;
        setDirectUpload(upload);
        formData.set("storagePath", upload.path);
        formData.set("fileName", upload.fileName);
        formData.set("mimeType", upload.mimeType);
      } else {
        formData.set("file", file);
      }

      const response = await fetch("/api/extract-receipt", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      const payload = (await response.json().catch(() => ({}))) as ExtractResponse;

      if (!response.ok || !payload.extractedText) {
        setError(payload.error ?? "Could not read this receipt. Try a clearer, closer photo.");
        return null;
      }

      setOcrText(payload.extractedText);
      setWarning("Text extracted. Running AI analysis now.");
      return { text: payload.extractedText, upload: uploadedFile };
    } catch (error) {
      setError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Text extraction took too long. Try a clearer, smaller image."
          : "Could not extract receipt text. Please check your connection and try again."
      );
      return null;
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  async function extractTextOnly() {
    const result = await extractText();
    if (result) {
      setWarning("Review the extracted text, then run AI analysis.");
    }
  }

  async function submit(demoMode = false) {
    if (!demoMode && !file && !ocrText.trim()) {
      setError("Choose a receipt image or use live capture before analyzing.");
      setWarning(null);
      return;
    }

    let textForAnalysis = ocrText.trim();
    let uploadForAnalysis = directUpload;
    if (!demoMode && !textForAnalysis) {
      const extracted = await extractText();
      if (!extracted) return;
      textForAnalysis = extracted.text.trim();
      uploadForAnalysis = extracted.upload;
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.set("sourceType", sourceType);
      formData.set("demoMode", String(demoMode));
      healthGoals.forEach((goal) => formData.append("healthGoals", goal));
      if (textForAnalysis && !demoMode) {
        formData.set("rawText", textForAnalysis);
        if (uploadForAnalysis) {
          formData.set("storagePath", uploadForAnalysis.path);
          formData.set("fileName", uploadForAnalysis.fileName);
          formData.set("mimeType", uploadForAnalysis.mimeType);
        } else if (file) {
          formData.set("file", file);
        }
      } else if (file && !demoMode) {
        formData.set("file", file);
      }

      const response = await fetch("/api/analyze-receipt", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      const payload = (await response.json().catch(() => ({}))) as Partial<ReceiptResponse>;

      if (!response.ok) {
        setError(payload.error ?? "Could not analyze receipt. Please try again.");
        return;
      }

      if (!payload.analysis) {
        setError("Analysis finished without results. Please try a sharper image.");
        return;
      }

      setAnalysis(payload.analysis);
      setWarning(payload.warning ?? null);
    } catch (error) {
      setError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Analysis took too long. Please try a clearer, smaller image."
          : "Could not analyze receipt. Please check your connection and try again."
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <ScanGuide />
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Upload receipt or order screenshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt-source">Receipt source</Label>
            <select
              id="receipt-source"
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as typeof sourceType)}
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0a0e16]/80 px-3 text-sm text-white focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="grocery_receipt">Grocery receipt</option>
              <option value="food_delivery">Restaurant / food delivery</option>
              <option value="quick_commerce">Quick-commerce order</option>
            </select>
            <p className="text-xs text-muted-foreground">This source is used to attach the scan correctly inside My Diary.</p>
          </div>
          <div className="scan-frame rounded-2xl border border-dashed border-primary/30 bg-white/5 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Label>Receipt image, camera capture, or PDF</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  On mobile, use live capture to scan the bill directly.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  htmlFor="receipt-camera"
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(129,247,89,0.28)] transition hover:bg-[#86fd5e]"
                >
                  <Camera className="h-4 w-4" />
                  Capture live
                </label>
                <label
                  htmlFor="receipt-file"
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  <FileImage className="h-4 w-4" />
                  Upload file
                </label>
              </div>
            </div>
            <Input
              id="receipt-camera"
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            <Input
              id="receipt-file"
              className="hidden"
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            {file ? (
              <div className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[120px_1fr]">
                <div className="scan-frame grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-white/5">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Selected receipt preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 self-center">
                  <p className="truncate font-semibold text-white">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)} selected
                    {originalSize ? `, compressed from ${formatFileSize(originalSize)}` : ""}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt-ocr">Paste or review receipt/order text</Label>
            <Textarea
              id="receipt-ocr"
              value={ocrText}
              onChange={(event) => {
                setOcrText(event.target.value);
                setError(null);
                setWarning(null);
              }}
              placeholder="Paste Swiggy, Zomato, Zepto, Blinkit, grocery bill, or extracted receipt text here..."
              className="min-h-40"
            />
          </div>
          <HealthGoalSelector selectedGoals={healthGoals} onChange={setHealthGoals} />
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          {warning ? <p className="text-sm text-orange-100">{warning}</p> : null}
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" onClick={() => submit(false)} disabled={loading || processingFile}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Analyze receipt
            </Button>
            {file ? (
              <Button className="w-full sm:w-auto" variant="secondary" onClick={extractTextOnly} disabled={loading || processingFile}>
                <FileImage className="h-4 w-4" />
                Extract text only
              </Button>
            ) : null}
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => submit(true)} disabled={loading}>
              <PlayCircle className="h-4 w-4" />
              Try demo analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <ProcessingSteps
          title="Analyzing your receipt"
          steps={[
            "Reading bill text",
            "Finding food and prices",
            "Preparing score and swaps"
          ]}
        />
      ) : null}

      {analysis ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <HealthScoreGauge
              score={analysis.healthScore}
              category={analysis.scoreCategory}
            />
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Smart receipt insight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{analysis.aiSummary}</p>
              </CardContent>
            </Card>
          </div>
          {analysis.receiptType === "restaurant_bill" ? (
            <Card className="glass-panel border-primary/25">
              <CardHeader>
                <CardTitle>Restaurant meal intelligence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {analysis.mealBalanceSummary}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground">Protein score</p>
                    <p className="mt-2 text-2xl font-black text-primary">
                      {analysis.proteinScore ?? 0}/100
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground">Risk level</p>
                    <p className="mt-2 text-2xl font-black capitalize text-white">
                      {analysis.riskLevel ?? "medium"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground">Inferred calories</p>
                    <p className="mt-2 text-2xl font-black capitalize text-white">
                      {analysis.nutritionInference?.estimatedCaloriesLevel ?? "unknown"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                    <p className="font-bold text-primary">What was good</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                      {(analysis.positives ?? []).map((positive) => (
                        <li key={positive}>{positive}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-orange-300/20 bg-orange-500/10 p-4">
                    <p className="font-bold text-orange-100">What to watch</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                      {(analysis.concerns ?? []).map((concern) => (
                        <li key={concern}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {(analysis.suggestions ?? []).length > 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="font-bold text-white">Next order suggestions</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {(analysis.suggestions ?? []).map((suggestion) => (
                        <p key={suggestion} className="rounded-lg bg-black/20 p-3 text-sm leading-6 text-muted-foreground">
                          {suggestion}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          <ReceiptCoverage coverage={analysis.coverageSummary} />
          <ExtractedReceiptText text={analysis.extractedText} />
          <DetectedItems items={analysis.detectedItems} />
          <ItemInsightList insights={analysis.itemInsights} />
          <RiskFlags risks={analysis.riskFlags} />
          <FutureHealthRisks risks={analysis.futureHealthRisks} />
          <SwapList swaps={analysis.swaps} />
          <SmartGroceryList swaps={analysis.swaps} risks={analysis.riskFlags} />
          <BudgetHealthCombo cost={analysis.costSummary} />
          <CostSummary cost={analysis.costSummary} />
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>7-day action plan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {analysis.actionPlan.map((step) => (
                <div key={step} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                  {step}
                </div>
              ))}
            </CardContent>
          </Card>
          <Disclaimer />
        </div>
      ) : null}
    </div>
  );
}
