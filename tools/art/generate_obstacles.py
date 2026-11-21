#!/usr/bin/env python3
"""TEMP obstacle sprites for Match-3 (crate / ice). Original procedural art."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / "apps/client/public/assets/match3"


def save(im: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    im.save(path, "WEBP", quality=92, method=6)
    print("OBS", path.name, path.stat().st_size)


def crate(size: int = 128) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    m = 10
    # shadow
    d.rounded_rectangle((m + 4, m + 8, size - m, size - m + 4), radius=14, fill=(0, 0, 0, 70))
    # wood box
    d.rounded_rectangle((m, m, size - m - 4, size - m - 4), radius=12, fill=(176, 118, 58, 255))
    d.rounded_rectangle((m + 8, m + 8, size - m - 12, size - m - 12), radius=8, fill=(210, 150, 78, 255))
    # planks
    for y in (m + 28, m + 52, m + 76):
        d.rectangle((m + 12, y, size - m - 16, y + 6), fill=(140, 90, 40, 220))
    # straps
    d.rectangle((size // 2 - 6, m + 10, size // 2 + 2, size - m - 14), fill=(90, 60, 30, 255))
    d.rectangle((m + 10, size // 2 - 6, size - m - 14, size // 2 + 2), fill=(90, 60, 30, 255))
    gloss = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.ellipse((m + 12, m + 8, size // 2, m + 36), fill=(255, 255, 255, 55))
    im.alpha_composite(gloss)
    return im


def ice(size: int = 128) -> Image.Image:
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    m = 8
    d.rounded_rectangle((m + 3, m + 6, size - m, size - m + 2), radius=18, fill=(0, 40, 60, 50))
    d.rounded_rectangle((m, m, size - m - 4, size - m - 4), radius=16, fill=(160, 230, 255, 140))
    d.rounded_rectangle((m + 10, m + 10, size - m - 14, size - m - 14), radius=12, fill=(210, 245, 255, 110))
    # cracks
    d.line((m + 24, m + 30, size // 2, size // 2), fill=(255, 255, 255, 160), width=3)
    d.line((size // 2, size // 2, size - m - 28, m + 36), fill=(255, 255, 255, 140), width=2)
    d.line((size // 2 - 10, size // 2, size // 2 + 8, size - m - 24), fill=(180, 230, 255, 180), width=2)
    gloss = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    gd.ellipse((m + 16, m + 12, size // 2 + 10, m + 40), fill=(255, 255, 255, 90))
    gloss = gloss.filter(ImageFilter.GaussianBlur(1))
    im.alpha_composite(gloss)
    return im


def main() -> None:
    save(crate(), "blocker_crate.webp")
    save(ice(), "blocker_ice.webp")


if __name__ == "__main__":
    main()
