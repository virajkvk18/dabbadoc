import { jsPDF } from "jspdf";
import { DABBADOC_DISCLAIMER } from "@/types";
import { formatAppDateTime } from "@/lib/date-time";

export function generateHealthReportPdf(params: {
  userName: string;
  dateRange: string;
  generatedAt: string;
  reportData?: Record<string, unknown>;
}) {
  const doc = new jsPDF();
  const score = Number(params.reportData?.healthScore ?? 72);
  const weeklyAverage = Number(params.reportData?.weeklyAverage ?? score);
  const streakDays = Number(params.reportData?.streakDays ?? 0);
  const topPattern = String(params.reportData?.topHealthPattern ?? "No repeated warning pattern yet");
  const alerts = Array.isArray(params.reportData?.predictiveHealthAlerts)
    ? (params.reportData.predictiveHealthAlerts as Array<Record<string, unknown>>).slice(0, 3)
    : [];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DabbaDoc Health Report", 18, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`User: ${params.userName}`, 18, 36);
  doc.text(`Date range: ${params.dateRange}`, 18, 43);
  doc.text(`Generated: ${formatAppDateTime(params.generatedAt)}`, 18, 50);
  doc.text(`Dabba Health Index: ${score}/100`, 18, 57);

  doc.setFont("helvetica", "bold");
  doc.text("Recent diary summary", 18, 73);
  doc.setFont("helvetica", "normal");
  doc.text(`Weekly Food Index average: ${weeklyAverage}/100`, 18, 81);
  doc.text(`Current diary streak: ${streakDays} days`, 18, 88);
  doc.text(`Top pattern: ${topPattern}`, 18, 95, { maxWidth: 172 });

  doc.setFont("helvetica", "bold");
  doc.text("Predictive early-warning patterns", 18, 112);
  doc.setFont("helvetica", "normal");
  const alertLines = alerts.length
    ? alerts.map((alert) => `${String(alert.title ?? "Pattern detected")}: ${String(alert.reason ?? "Review recent food entries.")}`)
    : ["No strong repeated pattern was detected from the available diary entries."];
  alertLines.forEach((line, index) => doc.text(`- ${line}`, 22, 121 + index * 14, { maxWidth: 166 }));

  doc.setFont("helvetica", "bold");
  doc.text("Practical next steps", 18, 170);
  doc.setFont("helvetica", "normal");
  const recommendations = alerts
    .map((alert) => String(alert.recommendation ?? "").trim())
    .filter(Boolean);
  const actionLines = recommendations.length
    ? recommendations
    : ["Keep logging meals and scans to build a clearer weekly pattern."];
  actionLines.forEach((line, index) => doc.text(`${index + 1}. ${line}`, 22, 179 + index * 14, { maxWidth: 166 }));

  doc.setFontSize(9);
  doc.text(DABBADOC_DISCLAIMER, 18, 280, { maxWidth: 172 });

  return Buffer.from(doc.output("arraybuffer"));
}
