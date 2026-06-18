export const APP_TIME_ZONE = "Asia/Kolkata";
export const APP_TIME_ZONE_LABEL = "IST";

export type DateTimeValue = Date | string | number;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const hourFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  hourCycle: "h23"
});

function toDate(value: DateTimeValue) {
  return value instanceof Date ? value : new Date(value);
}

export function getAppDateKey(value: DateTimeValue = new Date()) {
  const parts = dateKeyFormatter.formatToParts(toDate(value));
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${year}-${month}-${day}`;
}

export function shiftAppDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function appDateKeyToDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

export function getGreetingForDate(value: DateTimeValue = new Date()) {
  const hourPart = hourFormatter
    .formatToParts(toDate(value))
    .find((part) => part.type === "hour")?.value;
  const hour = Number(hourPart ?? 0);

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

export function formatAppDate(value: DateTimeValue) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "medium"
  }).format(toDate(value));
}

export function formatAppLongDate(value: DateTimeValue) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(toDate(value));
}

export function formatAppTime(value: DateTimeValue, includeSeconds = false) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined,
    hour12: true
  }).format(toDate(value));
}

export function formatAppDateTime(value: DateTimeValue) {
  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(toDate(value));
  return `${formatted} ${APP_TIME_ZONE_LABEL}`;
}

export function formatAppShortDate(value: DateTimeValue) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "2-digit"
  }).format(toDate(value));
}

export function formatAppMonthDay(value: DateTimeValue) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "short"
  }).format(toDate(value));
}

export function formatAppWeekday(value: DateTimeValue) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE,
    weekday: "short"
  }).format(toDate(value));
}
