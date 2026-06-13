"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Camera, FileImage, Loader2, PlayCircle, ScanLine } from "lucide-react";
import { Disclaimer } from "@/components/common/disclaimer";
import { ProcessingSteps } from "@/components/common/processing-steps";
import {
  ExtractedReceiptText,
  RiskFlags,
  SwapList
} from "@/components/upload/analysis-list";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LabelAnalysis } from "@/types";

type LabelResponse = {
  analysis: LabelAnalysis;
  saved: boolean;
  warning?: string;
  error?: string;
};

export function LabelScanForm() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<LabelAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
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
    setWarning(null);
  }

  async function submit(demoMode = false) {
    if (!demoMode && !file) {
      setError("Choose a label image or use live capture before analyzing.");
      setWarning(null);
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    const formData = new FormData();
    formData.set("demoMode", String(demoMode));
    if (file && !demoMode) formData.set("file", file);

    const response = await fetch("/api/analyze-label", {
      method: "POST",
      body: formData
    });
    const payload = (await response.json()) as LabelResponse;

    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not analyze label.");
      return;
    }

    setAnalysis(payload.analysis);
    setWarning(payload.warning ?? null);
  }

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Upload packaged food label</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="scan-frame rounded-2xl border border-dashed border-primary/30 bg-white/5 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Label>Nutrition or ingredients label</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture the package label live or upload a saved image.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  htmlFor="label-camera"
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(129,247,89,0.28)] transition hover:bg-[#86fd5e]"
                >
                  <Camera className="h-4 w-4" />
                  Capture live
                </label>
                <label
                  htmlFor="label-file"
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  <FileImage className="h-4 w-4" />
                  Upload image
                </label>
              </div>
            </div>
            <Input
              id="label-camera"
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            <Input
              id="label-file"
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            {file ? (
              <div className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[120px_1fr]">
                <div className="scan-frame grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-white/5">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Selected label preview"
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
          {warning ? <p className="text-sm text-orange-100">{warning}</p> : null}
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Button className="w-full sm:w-auto" onClick={() => submit(false)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
              Analyze label
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => submit(true)} disabled={loading}>
              <PlayCircle className="h-4 w-4" />
              Try demo LabelScan
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <ProcessingSteps
          title="Reading the food label"
          steps={[
            "Extracting label text",
            "Checking nutrition signals",
            "Preparing safer alternatives"
          ]}
        />
      ) : null}

      {analysis ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <HealthScoreGauge
              score={analysis.labelTruthScore}
              category={analysis.safetyLevel}
            />
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>What you thought vs what label says</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">What you thought</p>
                  <p className="mt-2 text-white">{analysis.whatYouThought}</p>
                </div>
                <div className="rounded-xl border border-orange-300/20 bg-orange-500/10 p-4">
                  <p className="text-sm text-orange-100">What label says</p>
                  <p className="mt-2 text-white">{analysis.whatLabelSays}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <ExtractedReceiptText
            text={analysis.extractedText}
            title="Extracted label text"
          />
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>{analysis.productName}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {analysis.ingredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No ingredients list was confidently detected. Try a closer image of
                  the ingredients panel.
                </p>
              ) : null}
              {analysis.ingredients.map((ingredient) => (
                <span key={ingredient} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-muted-foreground">
                  {ingredient}
                </span>
              ))}
            </CardContent>
          </Card>
          <RiskFlags risks={analysis.warnings} />
          <SwapList swaps={analysis.betterAlternatives} />
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Label truth insight</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{analysis.aiSummary}</p>
            </CardContent>
          </Card>
          <Disclaimer />
        </div>
      ) : null}
    </div>
  );
}
