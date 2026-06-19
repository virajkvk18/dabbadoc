type LogLevel = "info" | "warn" | "error";

export function logEvent(
  level: LogLevel,
  event: string,
  metadata: Record<string, unknown> = {}
) {
  const entry = {
    level,
    event,
    service: "dabbadoc-express-backend",
    timestamp: new Date().toISOString(),
    ...metadata
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}
