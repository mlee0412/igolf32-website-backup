#!/usr/bin/env python3
"""Refresh the legacy iGolf event menu with the approved Beer & Wine package.

Pages 1–3 remain the original Space Hospitality event-menu artwork.  Page 4
uses the original layout, but corrects its generic open-bar heading and rate,
and removes categories that are not part of Beer & Wine Open Bar.

Source: SP32-OFFICE Drive file 1Fq9ZYrJdK48UJSbKSEvAbRTk13tHDj0z
"""

from pathlib import Path
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/tmp/igolf-event-menu-20260825/stale-event.pdf")
OUTPUT = ROOT / "assets/menus/igolf-event-menu-2026-08-25.pdf"
W, H = letter
ARIAL_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def centered(draw, text, y, font, canvas_width):
    box = draw.textbbox((0, 0), text, font=font)
    draw.text(((canvas_width - (box[2] - box[0])) / 2, y), text, font=font, fill="black")


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Missing source PDF: {SOURCE}")

    source = PdfReader(str(SOURCE))
    with tempfile.TemporaryDirectory() as temp_dir:
        rendered = Path(temp_dir) / "source-4.png"
        subprocess.run(
            ["pdftoppm", "-f", "4", "-l", "4", "-singlefile", "-png", "-r", "300", str(SOURCE), str(rendered.with_suffix(""))],
            check=True,
        )
        image = Image.open(rendered).convert("RGB")
        draw = ImageDraw.Draw(image)
        scale = image.width / 1275

        def scaled_box(box):
            return tuple(round(value * scale) for value in box)

        # Preserve the original page artwork and only replace the obsolete package header.
        draw.rounded_rectangle(scaled_box((127, 80, 1138, 280)), radius=round(18 * scale), fill="white")
        title_font = ImageFont.truetype(ARIAL_BOLD, round(49 * scale))
        rate_font = ImageFont.truetype(ARIAL_BOLD, round(32 * scale))
        minimum_font = ImageFont.truetype(ARIAL_BOLD, round(22 * scale))
        centered(draw, "BAY RENTAL + BEER & WINE OPEN BAR", round(131 * scale), title_font, image.width)
        centered(draw, "2 HOURS @ $69/PERSON  •  3 HOURS @ $103/PERSON", round(203 * scale), rate_font, image.width)
        centered(draw, "6 GUESTS MINIMUM PARTICIPATION REQUIRED", round(249 * scale), minimum_font, image.width)

        # The old generic package listed soju and champagne. They are not part of Beer & Wine Open Bar.
        draw.rectangle(scaled_box((129, 852, 1144, 1088)), fill="black")
        divider_y = round(852 * scale)
        draw.line((round(129 * scale), divider_y, round(1144 * scale), divider_y), fill="white", width=round(3 * scale))

        revised_page = Path(temp_dir) / "revised-page-4.jpg"
        image.save(revised_page, quality=94, subsampling=0)
        page_pdf = Path(temp_dir) / "revised-page-4.pdf"
        canvas = Canvas(str(page_pdf), pagesize=letter, pageCompression=1)
        canvas.drawImage(ImageReader(str(revised_page)), 0, 0, width=W, height=H)
        canvas.save()
        revised_page_pdf = PdfReader(str(page_pdf)).pages[0]

    writer = PdfWriter()
    for page in source.pages[:3]:
        writer.add_page(page)
    writer.add_page(revised_page_pdf)
    writer.add_metadata({
        "/Title": "iGolf Event & Group Menu",
        "/Author": "iGolf by Space",
        "/Subject": "Event menu with Beer & Wine Open Bar pricing",
    })
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("wb") as target:
        writer.write(target)


if __name__ == "__main__":
    main()
