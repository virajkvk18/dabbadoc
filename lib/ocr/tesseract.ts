import { createWorker } from "tesseract.js";

const TESSERACT_TIMEOUT_MS = 18_000;

export async function extractTextWithTesseract(dataUri?: string) {
  if (!dataUri) return null;

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let timeout: ReturnType<typeof setTimeout>;

  try {
    worker = await createWorker("eng");
    const timer = new Promise<null>((resolve) => {
      timeout = setTimeout(() => resolve(null), TESSERACT_TIMEOUT_MS);
    });
    const result = await Promise.race([worker.recognize(dataUri), timer]);
    clearTimeout(timeout!);
    if (!result) return null;
    const { data } = result;
    return data.text;
  } catch {
    return null;
  } finally {
    await worker?.terminate().catch(() => undefined);
  }
}
