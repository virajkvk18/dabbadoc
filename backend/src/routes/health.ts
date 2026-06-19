import { Router } from "express";
import { config, isSupabaseJwtVerificationConfigured } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.json({
    status: "ok",
    service: "dabbadoc-express-backend",
    uptimeSeconds: Math.round(process.uptime()),
    appUrl: config.appUrl,
    integrations: {
      supabaseJwtVerification: isSupabaseJwtVerificationConfigured(),
      groq: Boolean(config.groqApiKey),
      gemini: Boolean(config.geminiApiKey)
    }
  });
});
