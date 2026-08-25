#!/usr/bin/env python3
"""Build the current printable iGolf Beer & Wine Open Bar menu."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/menus/igolf-beer-wine-open-bar-menu-2026-08-25.pdf"
LOGO = ROOT / "assets/img/logo-horizontal-white.png"
W, H = letter
MARGIN = 38
CYAN = colors.HexColor("#21c7f4")
LIME = colors.HexColor("#a3db43")
MUTED = colors.HexColor("#d9d9d9")


def centered(canvas, text, y, font, size, color=colors.white):
    canvas.setFont(font, size)
    canvas.setFillColor(color)
    canvas.drawCentredString(W / 2, y, text)


def wrapped_centered(canvas, text, y, max_width, font, size, leading, color=colors.white):
    canvas.setFont(font, size)
    canvas.setFillColor(color)
    words, lines, line = text.split(), [], ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if stringWidth(candidate, font, size) <= max_width:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    for index, item in enumerate(lines):
        canvas.drawCentredString(W / 2, y - index * leading, item)


def item_box(canvas, x, y, width, height, label, body):
    canvas.setStrokeColor(colors.white)
    canvas.setLineWidth(1.25)
    canvas.roundRect(x, y - height, width, height, 8, stroke=1, fill=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 16)
    canvas.drawString(x + 16, y - 26, label.upper())
    canvas.setFillColor(MUTED)
    body_font, body_size = "Helvetica", 9.25
    canvas.setFont(body_font, body_size)
    cursor = y - 47
    max_width = width - 32
    for source_line in body:
        words, line = source_line.split(), ""
        for word in words:
            candidate = f"{line} {word}".strip()
            if stringWidth(candidate, body_font, body_size) <= max_width:
                line = candidate
            else:
                canvas.drawString(x + 16, cursor, line)
                cursor -= 12
                line = word
        if line:
            canvas.drawString(x + 16, cursor, line)
            cursor -= 12


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas = Canvas(str(OUTPUT), pagesize=letter, pageCompression=1)
    canvas.setTitle("iGolf Beer & Wine Open Bar Menu")
    canvas.setAuthor("iGolf by Space")
    canvas.setSubject("Beer & Wine Open Bar pricing and included beverages")
    canvas.setFillColor(colors.black)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.setStrokeColor(CYAN)
    canvas.setLineWidth(2)
    canvas.line(MARGIN, H - 28, W - MARGIN, H - 28)
    if LOGO.exists():
        canvas.drawImage(ImageReader(str(LOGO)), W / 2 - 84, H - 91, width=168, height=38, mask="auto", preserveAspectRatio=True)
    centered(canvas, "BAY RENTAL + BEER & WINE OPEN BAR", H - 133, "Helvetica-Bold", 25)
    centered(canvas, "OPEN BAR PACKAGE", H - 158, "Helvetica-Bold", 12, CYAN)
    canvas.setFillColor(colors.HexColor("#111111"))
    canvas.roundRect(MARGIN, H - 268, W - 2 * MARGIN, 79, 9, fill=1, stroke=0)
    centered(canvas, "2 HOURS  $69 / PERSON     •     3 HOURS  $103 / PERSON", H - 220, "Helvetica-Bold", 18)
    centered(canvas, "6 GUESTS MINIMUM PARTICIPATION REQUIRED", H - 246, "Helvetica-Bold", 11, LIME)
    left, gap = MARGIN, 16
    col_width = (W - 2 * MARGIN - gap) / 2
    top = H - 294
    item_box(canvas, left, top, col_width, 141, "Bottled Beers", [
        "1664 Kronenbourg • Allagash White • Angry Orchard",
        "Asahi • Blue Moon • Blue Point • Brooklyn • Coors Light",
        "Corona • Fat Tire • Kona Big Wave • Lagunitas IPA",
        "Mahou • Peroni • Presidente • Sam Adams • Stella",
    ])
    item_box(canvas, left + col_width + gap, top, col_width, 141, "Canned Drinks", [
        "Bud Light • Coney Island • Guinness • Kloud",
        "Michelob Ultra • Truly Seltzer • Voodoo Juice Force IPA",
        "White Claw",
    ])
    top -= 158
    item_box(canvas, left, top, col_width, 101, "Wine", [
        "Cabernet Sauvignon • Merlot • Pinot Noir",
        "Chardonnay • Pinot Grigio • Sauvignon Blanc",
    ])
    item_box(canvas, left + col_width + gap, top, col_width, 101, "Non-Alcoholic", [
        "Heineken 0.0 • Lagunitas IPNA",
        "Cranberry • Orange • Pineapple Juice • Hot / Iced Coffee",
        "Coke • Diet Coke • Sprite • Seltzer • Tonic • Ginger Ale",
    ])
    canvas.setStrokeColor(CYAN)
    canvas.setLineWidth(1)
    canvas.line(MARGIN, 168, W - MARGIN, 168)
    wrapped_centered(canvas, "Beer and wine package only. Spirits, soju, champagne, and cocktails are not included.", 145, W - 2 * MARGIN, "Helvetica-Bold", 11, 14, MUTED)
    centered(canvas, "iGOLF BY SPACE  •  32 W 32ND ST, NEW YORK, NY", 83, "Helvetica-Bold", 10)
    centered(canvas, "igolf32.com  •  (646) 838-4004", 64, "Helvetica", 10, MUTED)
    canvas.setStrokeColor(CYAN)
    canvas.setLineWidth(2)
    canvas.line(MARGIN, 34, W - MARGIN, 34)
    canvas.save()


if __name__ == "__main__":
    main()
