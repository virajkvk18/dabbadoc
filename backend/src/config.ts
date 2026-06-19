import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

function numberFromEnv(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) ? value : fallback;
}

function listFromEnv(name: string, fallback: string[]) {
  const value = process.env[name];
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: numberFromEnv("EXPRESS_API_PORT", 4000),
  appUrl: process.env.DABBADOC_APP_URL || defaultAppUrl,
  allowedOrigins: listFromEnv("EXPRESS_CORS_ORIGINS", [defaultAppUrl]),
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey:
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqTextModel: process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash"
};

export function isSupabaseJwtVerificationConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

export function isProduction() {
  return config.nodeEnv === "production";
}
