#!/usr/bin/env python3
"""Generate Paradise Premium Stylized UI sprites (original, CC0-like project assets)."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / "apps/client/public/assets/ui"

PALETTE = {
    "turquoise": (30, 180, 190, 255),
    "coral": (255, 107, 107, 255),
    "sand": (242, 201, 120, 255),
    "green": (46, 180, 110, 255),
    "deep": (6, 54, 48, 255),
    "gold": (255, 206, 84, 255),
    "white": (255, 255, 255, 255),
}


def save(im: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    im.save(path, "WEBP", quality=92, method=6)
    print("UI", path.name, path.stat().st_size)


def glossy_button(w: int, h: int, fill, label_dots: bool = False) -> Image.Image:
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = h // 2
    # shadow
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((4, 6, w - 2, h - 1), radius=r, fill=(0, 0, 0, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    im.alpha_composite(shadow)
    d.rounded_rectangle((0, 0, w - 6, h - 8), radius=r - 2, fill=fill)
    # gloss
    gloss = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.rounded_rectangle((8, 6, w - 16, h // 2 - 2), radius=r // 2, fill=(255, 255, 255, 70))
    im.alpha_composite(gloss)
    if label_dots:
        cx, cy = w // 2 - 3, h // 2 - 4
        d.ellipse((cx - 18, cy - 4, cx - 10, cy + 4), fill=PALETTE["white"])
        d.ellipse((cx - 4, cy - 4, cx + 4, cy + 4), fill=PALETTE["white"])
        d.ellipse((cx + 10, cy - 4, cx + 18, cy + 4), fill=PALETTE["white"])
    return im


def coin_icon(size: int = 128) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    m = 8
    d.ellipse((m + 4, m + 6, size - m, size - m + 2), fill=(0, 0, 0, 60))
    d.ellipse((m, m, size - m - 4, size - m - 4), fill=PALETTE["gold"])
    d.ellipse((m + 10, m + 10, size - m - 14, size - m - 14), outline=(210, 150, 40, 255), width=4)
    d.ellipse((m + 18, m + 16, m + 40, m + 32), fill=(255, 255, 255, 90))
    return im


def diamond_icon(size: int = 128) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = size // 2
    pts = [(cx, cy - 40), (cx + 36, cy - 8), (cx, cy + 42), (cx - 36, cy - 8)]
    d.polygon(pts, fill=(90, 210, 255, 255))
    d.polygon([(cx, cy - 40), (cx + 36, cy - 8), (cx, cy - 4)], fill=(180, 240, 255, 255))
    d.polygon([(cx, cy - 40), (cx - 36, cy - 8), (cx, cy - 4)], fill=(40, 160, 220, 255))
    return im


def star_icon(size: int = 128) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx = cy = size / 2
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = 46 if i % 2 == 0 else 20
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=PALETTE["gold"])
    d.ellipse((cx - 10, cy - 22, cx + 6, cy - 8), fill=(255, 255, 255, 100))
    return im


def nav_icon(kind: str, size: int = 96) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = PALETTE["white"]
    if kind == "island":
        d.ellipse((18, 40, 78, 72), fill=PALETTE["turquoise"])
        d.ellipse((28, 28, 68, 58), fill=PALETTE["green"])
        d.polygon([(55, 50), (62, 18), (70, 50)], fill=(139, 90, 43, 255))
        d.ellipse((58, 10, 82, 34), fill=PALETTE["green"])
    elif kind == "play":
        d.ellipse((10, 10, 86, 86), fill=PALETTE["coral"])
        d.polygon([(38, 28), (72, 48), (38, 68)], fill=c)
    elif kind == "shop":
        d.rounded_rectangle((22, 34, 74, 78), 8, fill=PALETTE["sand"])
        d.polygon([(22, 34), (48, 18), (74, 34)], fill=PALETTE["coral"])
    elif kind == "team":
        d.ellipse((22, 22, 46, 46), fill=PALETTE["turquoise"])
        d.ellipse((50, 22, 74, 46), fill=PALETTE["coral"])
        d.ellipse((36, 40, 60, 64), fill=PALETTE["green"])
    elif kind == "pvp":
        d.polygon([(20, 70), (48, 18), (52, 40), (76, 22), (60, 78)], fill=PALETTE["coral"])
        d.polygon([(28, 70), (48, 34), (44, 48), (68, 30), (56, 78)], fill=PALETTE["gold"])
    return im


def panel_bg(w: int = 512, h: int = 320) -> Image.Image:
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((8, 8, w - 8, h - 8), 28, fill=(8, 70, 58, 230))
    d.rounded_rectangle((8, 8, w - 8, h - 8), 28, outline=PALETTE["turquoise"], width=4)
    d.rounded_rectangle((20, 20, w - 20, 72), 16, fill=(12, 100, 82, 255))
    return im


def main() -> None:
    save(glossy_button(280, 88, PALETTE["coral"]), "btn_primary.webp")
    save(glossy_button(280, 88, PALETTE["turquoise"]), "btn_secondary.webp")
    save(glossy_button(280, 88, PALETTE["green"]), "btn_success.webp")
    save(glossy_button(200, 72, PALETTE["sand"], True), "btn_zone.webp")
    save(coin_icon(), "icon_coins.webp")
    save(diamond_icon(), "icon_diamonds.webp")
    save(star_icon(), "icon_build_star.webp")
    for k in ("island", "play", "shop", "team", "pvp"):
        save(nav_icon(k), f"nav_{k}.webp")
    save(panel_bg(), "panel_card.webp")
    # lock / build icons
    lock = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(lock)
    d.rounded_rectangle((28, 42, 68, 78), 8, fill=(120, 130, 140, 255))
    d.arc((32, 18, 64, 54), 0, 180, fill=(180, 190, 200, 255), width=6)
    save(lock, "icon_locked.webp")
    hammer = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(hammer)
    d.rounded_rectangle((20, 28, 70, 46), 6, fill=(180, 120, 60, 255))
    d.rectangle((42, 44, 54, 78), fill=(210, 180, 120, 255))
    save(hammer, "icon_build.webp")


if __name__ == "__main__":
    main()
