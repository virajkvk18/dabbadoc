import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const skippedDirectories = new Set([
  ".git",
  ".next",
  ".vercel",
  "coverage",
  "dist",
  "node_modules",
  "out"
]);
const skippedFiles = new Set(["package-lock.json", "tsconfig.tsbuildinfo"]);

const suspiciousEnvKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "DABBA_AGENT_TOKEN"
];

const secretPatterns = [
  {
    name: "private key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/
  },
  {
    name: "OpenAI-style API key",
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/
  },
  {
    name: "JWT token",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
  },
  {
    name: "Razorpay secret",
    pattern: /\brzp_(?:live|test)_[A-Za-z0-9]{12,}\b/
  },
  {
    name: "Supabase JWT-like key",
    pattern: /\b(?:anon|service_role)\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/
  }
];

function isTextFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return [
    "",
    ".cjs",
    ".css",
    ".env",
    ".example",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mjs",
    ".sql",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml"
  ].includes(extension);
}

function walk(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if (!skippedDirectories.has(entry)) files.push(...walk(absolutePath));
      continue;
    }

    if (!stats.isFile() || skippedFiles.has(entry) || !isTextFile(absolutePath)) continue;
    files.push(absolutePath);
  }

  return files;
}

function scanEnvAssignments(content, relativePath) {
  const findings = [];

  for (const line of content.split(/\r?\n/)) {
    for (const key of suspiciousEnvKeys) {
      const match = line.match(new RegExp(`^\\s*${key}\\s*=\\s*([^#]*)`));
      if (!match) continue;

      const value = match[1].trim().replace(/^['"]|['"]$/g, "");
      const normalizedValue = value.toLowerCase();
      if (
        !value ||
        normalizedValue.includes("your_") ||
        normalizedValue.includes("your-") ||
        normalizedValue.includes("example") ||
        value.includes("<") ||
        value.includes("...")
      ) {
        continue;
      }

      findings.push({
        file: relativePath,
        type: `${key} value`,
        preview: `${key}=***`
      });
    }
  }

  return findings;
}

function scanPatternMatches(content, relativePath) {
  const findings = [];

  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) {
      findings.push({
        file: relativePath,
        type: name,
        preview: "matched secret-like token"
      });
    }
  }

  return findings;
}

const findings = [];

for (const file of walk(root)) {
  const relativePath = path.relative(root, file);
  const content = readFileSync(file, "utf8");
  findings.push(...scanEnvAssignments(content, relativePath));
  findings.push(...scanPatternMatches(content, relativePath));
}

if (findings.length > 0) {
  console.error("Potential committed secrets found:");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.type} (${finding.preview})`);
  }
  process.exitCode = 1;
} else {
  console.log("No committed secrets detected by the local scanner.");
}
