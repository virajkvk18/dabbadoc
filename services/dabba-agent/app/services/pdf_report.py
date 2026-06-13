from __future__ import annotations
import base64
from io import BytesIO
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors


def _safe(value: Any) -> str:
    return str(value or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def generate_pdf_base64(title: str, analysis: dict[str, Any]) -> str:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(_safe(title), styles["Title"]))
    story.append(Spacer(1, 12))

    dhi = analysis.get("dabba_health_index", {})
    story.append(Paragraph(f"<b>Dabba Health Index:</b> {_safe(dhi.get('score'))}/100 - {_safe(dhi.get('grade'))}", styles["Heading2"]))
    story.append(Paragraph(_safe(dhi.get("summary")), styles["BodyText"]))
    story.append(Spacer(1, 12))

    explanation = analysis.get("hinglish_explanation") or ""
    story.append(Paragraph("<b>Simple Explanation</b>", styles["Heading2"]))
    story.append(Paragraph(_safe(explanation), styles["BodyText"]))
    story.append(Spacer(1, 12))

    flags = analysis.get("risk_flags") or []
    if flags:
        story.append(Paragraph("<b>Risk Flags</b>", styles["Heading2"]))
        data = [["Flag", "Severity", "Why it matters"]]
        for f in flags[:8]:
            data.append([_safe(f.get("flag")), _safe(f.get("severity")), _safe(f.get("why_it_matters"))])
        table = Table(data, colWidths=[120, 70, 300])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(table)
        story.append(Spacer(1, 12))

    swaps = analysis.get("healthier_swaps") or []
    if swaps:
        story.append(Paragraph("<b>Healthier Swaps</b>", styles["Heading2"]))
        for s in swaps[:8]:
            story.append(Paragraph(f"• Replace <b>{_safe(s.get('replace'))}</b> with {_safe(s.get('with_item'))}: {_safe(s.get('why_better'))}", styles["BodyText"]))
        story.append(Spacer(1, 12))

    plan = analysis.get("seven_day_action_plan") or []
    if plan:
        story.append(Paragraph("<b>7-Day Action Plan</b>", styles["Heading2"]))
        for p in plan[:7]:
            story.append(Paragraph(f"Day {_safe(p.get('day'))}: {_safe(p.get('action'))}", styles["BodyText"]))
        story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Disclaimer:</b> Educational food insight only. Not medical diagnosis.", styles["Italic"]))
    doc.build(story)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
