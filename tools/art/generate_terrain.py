#!/usr/bin/env python3
"""Zone backdrop tiles — stylized 2D, original project art."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / "apps/client/public/assets/terrain"

ZONES = [
    ("z1_beach", (242, 210, 140), (80, 200, 210), "sand"),
    ("z2_shore", (230, 190, 120), (40, 170, 190), "deck"),
    ("z3_grove", (70, 170, 100), (40, 140, 90), "grass"),
    ("z4_plaza", (210, 180, 140), (180, 150, 110), "stone"),
    ("z5_lagoon", (40, 180, 190), (20, 120, 150), "water"),
    ("z6_festival", (255, 170, 140), (255, 120, 150), "party"),
    ("z7_cape", (150, 140, 130), (60, 140, 170), "rock"),
]


def zone_bg(name: str, a, b, kind: str) -> Image.Image:
    w, h = 720, 980
    im = Image.new("RGBA", (w, h), a + (255,))
    d = ImageDraw.Draw(im)
    # sky band
    for y in range(0, 220):
        t = y / 220
        col = (
            int(90 + 40 * t),
            int(180 + 30 * t),
            int(210 + 20 * t),
            255,
        )
        d.line([(0, y), (w, y)], fill=col)
    # ground wash
    d.ellipse((-80, 280, w + 80, h + 40), fill=a + (255,))
    d.ellipse((40, 520, w - 40, h + 60), fill=tuple(max(0, c - 25) for c in a) + (255,))
    if kind in ("sand", "deck", "water", "lagoon"):
        d.ellipse((220, 600, w + 120, h + 80), fill=b + (220,))
    if kind == "grass":
        for i in range(18):
            x = 40 + i * 40
            d.ellipse((x, 420 + (i % 3) * 30, x + 50, 480 + (i % 3) * 30), fill=b + (200,))
    if kind == "party":
        for i in range(12):
            x = 30 + i * 58
            d.line([(x, 260), (x + 30, 320)], fill=(255, 220, 100, 200), width=3)
            d.ellipse((x + 24, 312, x + 40, 328), fill=(255, 100, 140, 230))
    if kind == "rock":
        d.polygon([(80, 700), (200, 420), (340, 700)], fill=b + (255,))
        d.polygon([(400, 720), (520, 380), (680, 740)], fill=tuple(max(0, c - 20) for c in b) + (255,))
    # soft vignette
    vig = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    vd.rectangle((0, 0, w, h), outline=(0, 40, 30, 40), width=40)
    vig = vig.filter(ImageFilter.GaussianBlur(20))
    im.alpha_composite(vig)
    return im


def silhouette() -> Image.Image:
    im = Image.new("RGBA", (320, 240), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(40, 180), (100, 80), (160, 180)], fill=(40, 70, 80, 120))
    d.polygon([(140, 190), (220, 70), (300, 200)], fill=(30, 60, 70, 100))
    d.ellipse((180, 40, 230, 90), fill=(50, 90, 100, 90))
    return im


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, a, b, kind in ZONES:
        path = OUT / f"{name}.webp"
        zone_bg(name, a, b, kind).save(path, "WEBP", quality=85, method=6)
        print(path.name, path.stat().st_size)
    sil = OUT / "silhouette_locked.webp"
    silhouette().save(sil, "WEBP", quality=85, method=6)
    print(sil.name)


if __name__ == "__main__":
    main()
