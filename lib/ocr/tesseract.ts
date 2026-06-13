import { createWorker } from "tesseract.js";

export async function extractTextWithTesseract(dataUri?: string) {
  if (!dataUri) return null;

  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(dataUri);
    await worker.terminate();
    return data.text;
  } catch {
    return null;
  }
}
