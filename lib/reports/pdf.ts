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
  doc.text("Receipt analysis summary", 18, 73);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Packaged snacks, sugary drinks, and fried foods may be pulling the score down.",
    18,
    81,
    { maxWidth: 172 }
  );

  doc.setFont("helvetica", "bold");
  doc.text("Healthy swaps", 18, 99);
  doc.setFont("helvetica", "normal");
  [
    "Maggi to oats upma or poha with peanuts",
    "Cola to chaas or nimbu pani",
    "Chips to roasted chana or makhana",
    "Biscuits to fruit and nuts or homemade chilla"
  ].forEach((line, index) => doc.text(`- ${line}`, 22, 108 + index * 7));

  doc.setFont("helvetica", "bold");
  doc.text("7-day action plan", 18, 145);
  doc.setFont("helvetica", "normal");
  [
    "Replace one sugary drink.",
    "Add one protein-rich snack.",
    "Avoid fried snacks for one evening.",
    "Read one packaged label.",
    "Add sabzi or salad to dinner.",
    "Repeat the easiest swap.",
    "Scan again and compare score."
  ].forEach((line, index) => doc.text(`${index + 1}. ${line}`, 22, 154 + index * 7));

  doc.setFontSize(9);
  doc.text(DABBADOC_DISCLAIMER, 18, 280, { maxWidth: 172 });

  return Buffer.from(doc.output("arraybuffer"));
}
