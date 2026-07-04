"""Generate PNG icons for PWA manifest."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT
ICONS.mkdir(parents=True, exist_ok=True)

try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit("Pillow not installed; run: pip install pillow")


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), "#f4f2ef")
    draw = ImageDraw.Draw(img)
    scale = size / 512

    def rounded_rect(x, y, w, h, r, fill, outline=None):
        draw.rounded_rectangle(
            [x * scale, y * scale, (x + w) * scale, (y + h) * scale],
            radius=r * scale,
            fill=fill,
            outline=outline,
        )

    rounded_rect(72, 120, 368, 120, 28, "#ffffff", "#e8e4df")
    rounded_rect(104, 152, 56, 56, 14, "#f5ede3")
    rounded_rect(176, 158, 160, 16, 8, "#2c2a28")
    rounded_rect(176, 186, 120, 12, 6, "#c4bdb6")
    rounded_rect(72, 272, 368, 120, 28, "#ffffff", "#e8e4df")
    rounded_rect(104, 304, 56, 56, 14, "#e8f0eb")
    rounded_rect(176, 310, 160, 16, 8, "#2c2a28")
    rounded_rect(176, 338, 120, 12, 6, "#c4bdb6")
    return img


for px in (192, 512):
    draw_icon(px).save(ICONS / f"icon-{px}.png")

print("Generated icon-192.png and icon-512.png")
