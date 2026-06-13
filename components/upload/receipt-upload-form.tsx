"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Camera, FileImage, Loader2, PlayCircle, Upload } from "lucide-react";
import { Disclaimer } from "@/components/common/disclaimer";
import {
  CostSummary,
  DetectedItems,
  RiskFlags,
  SwapList
} from "@/components/upload/analysis-list";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReceiptAnalysis } from "@/types";

type ReceiptResponse = {
  analysis: ReceiptAnalysis;
  saved: boolean;
  error?: string;
};

export function ReceiptUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(nextFile?: File | null) {
    setFile(nextFile ?? null);
    setError(null);
  }

  async function submit(demoMode = false) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("sourceType", "grocery_receipt");
    formData.set("demoMode", String(demoMode));
    if (file && !demoMode) formData.set("file", file);

    const response = await fetch("/api/analyze-receipt", {
      method: "POST",
      body: formData
    });
    const payload = (await response.json()) as ReceiptResponse;

    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not analyze receipt.");
      return;
    }

    setAnalysis(payload.analysis);
  }

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Upload receipt or order screenshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    {(file.size / 1024 / 1024).toFixed(2)} MB selected
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" onClick={() => submit(false)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Analyze upload
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => submit(true)} disabled={loading}>
              <PlayCircle className="h-4 w-4" />
              Try demo analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/10"
            />
          ))}
        </div>
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
          <DetectedItems items={analysis.detectedItems} />
          <RiskFlags risks={analysis.riskFlags} />
          <SwapList swaps={analysis.swaps} />
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
