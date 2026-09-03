"""
CodeMind AI — Master Architecture Blueprint PDF Generator
Generates a polished, professional, multi-page PDF document from the markdown blueprint.
"""

import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#737373"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "CODEMIND AI — MASTER ARCHITECTURE & CAPABILITIES BLUEPRINT")
            self.setStrokeColor(colors.HexColor("#E5E5E5"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer (all pages)
        self.setFont("Helvetica", 8)
        self.setStrokeColor(colors.HexColor("#E5E5E5"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        self.drawString(54, 32, "Confidential • Axiogen AI / CodeMind Autonomous Platform")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()


def build_pdf(md_path: str, pdf_path: str):
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#059669'),
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        leftIndent=14,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=3,
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )

    story = []

    with open(md_path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    in_code_block = False
    code_buffer = []
    in_table = False
    table_rows = []

    # Title Banner
    story.append(Paragraph("CodeMind AI", title_style))
    story.append(Paragraph("Master System Architecture & Full Capabilities Blueprint", subtitle_style))
    story.append(Paragraph("<i>Autonomous Repository Understanding, Multi-Language AST Analysis & In-Memory Software Transformation</i>", body_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#059669'), spaceBefore=4, spaceAfter=12))

    for line in lines:
        raw = line.rstrip()

        # Handle Code blocks
        if raw.startswith("```"):
            if in_code_block:
                # End of code block
                in_code_block = False
                code_text = "<br/>".join([c.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;") for c in code_buffer])
                if code_text.strip():
                    p = Paragraph(code_text, code_style)
                    t = Table([[p]], colWidths=[504])
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
                        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                        ('LEFTPADDING', (0, 0), (-1, -1), 8),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ]))
                    story.append(t)
                    story.append(Spacer(1, 6))
                code_buffer = []
            else:
                in_code_block = True
                code_buffer = []
            continue

        if in_code_block:
            code_buffer.append(raw)
            continue

        # Handle Markdown Tables
        if raw.startswith("|") and raw.endswith("|"):
            cells = [c.strip() for c in raw.strip("|").split("|")]
            # Skip delimiter line
            if all(re.match(r'^:?-+:?$', c) for c in cells):
                continue
            if not in_table:
                in_table = True
                table_rows = []
            table_rows.append(cells)
            continue
        elif in_table:
            # End of table
            in_table = False
            if table_rows:
                # Render table
                formatted_data = []
                # Header row
                header = [Paragraph(f"<b>{c}</b>", table_header_style) for c in table_rows[0]]
                formatted_data.append(header)
                # Body rows
                for row in table_rows[1:]:
                    r = [Paragraph(c, table_cell_style) for c in row]
                    formatted_data.append(r)

                num_cols = len(table_rows[0])
                if num_cols == 2:
                    col_widths = [150, 354]
                elif num_cols == 3:
                    col_widths = [70, 150, 284]
                elif num_cols == 5:
                    col_widths = [160, 80, 110, 80, 74]
                else:
                    col_widths = [504 / num_cols] * num_cols

                tbl = Table(formatted_data, colWidths=col_widths)
                tbl.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
                ]))
                story.append(tbl)
                story.append(Spacer(1, 8))
            table_rows = []

        # Skip empty lines
        if not raw.strip():
            continue

        # Skip Markdown title if it matches cover
        if raw.startswith("# CodeMind AI"):
            continue

        # Headers
        if raw.startswith("# "):
            text = raw[2:].strip()
            story.append(Paragraph(text, h1_style))
            story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#CBD5E1'), spaceBefore=2, spaceAfter=6))
        elif raw.startswith("## "):
            text = raw[3:].strip()
            story.append(Paragraph(text, h1_style))
        elif raw.startswith("### "):
            text = raw[4:].strip()
            story.append(Paragraph(text, h2_style))
        elif raw.startswith("- ") or raw.startswith("* "):
            text = raw[2:].strip()
            # Clean bold markers
            formatted = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            story.append(Paragraph(f"• &nbsp; {formatted}", bullet_style))
        elif re.match(r'^\d+\.\s+', raw):
            formatted = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', raw)
            story.append(Paragraph(formatted, bullet_style))
        elif raw.startswith(">"):
            text = raw.lstrip(">").strip()
            formatted = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            p = Paragraph(f"<i>{formatted}</i>", body_style)
            t = Table([[p]], colWidths=[504])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#86EFAC')),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(t)
            story.append(Spacer(1, 6))
        elif raw.startswith("---"):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceBefore=6, spaceAfter=8))
        else:
            formatted = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', raw)
            formatted = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', formatted)
            story.append(Paragraph(formatted, body_style))

    # Flush remaining table
    if in_table and table_rows:
        formatted_data = []
        header = [Paragraph(f"<b>{c}</b>", table_header_style) for c in table_rows[0]]
        formatted_data.append(header)
        for row in table_rows[1:]:
            r = [Paragraph(c, table_cell_style) for c in row]
            formatted_data.append(r)
        num_cols = len(table_rows[0])
        col_widths = [504 / num_cols] * num_cols
        tbl = Table(formatted_data, colWidths=col_widths)
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        story.append(tbl)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at: {pdf_path}")

if __name__ == "__main__":
    md_file = r"C:\Users\aditya\.gemini\antigravity\brain\adba3b83-487b-4206-8f8e-c60a3ba4e339\codemind_ai_master_blueprint.md"
    out_pdf = r"C:\Users\aditya\.gemini\antigravity\brain\adba3b83-487b-4206-8f8e-c60a3ba4e339\codemind_ai_master_blueprint.pdf"
    
    # Also save a copy directly in project root for easy user access
    project_copy = r"C:\Users\aditya\.gemini\antigravity\scratch\codemind-ai\CODEMIND_AI_MASTER_BLUEPRINT.pdf"
    
    build_pdf(md_file, out_pdf)
    build_pdf(md_file, project_copy)
