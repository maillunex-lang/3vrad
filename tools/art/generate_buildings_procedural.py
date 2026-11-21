#!/usr/bin/env python3
"""Stylized isometric building sprites for B02–B20 (WIP until final art pass).

Not claimed as final Premium Stylized approved art — original project-owned
procedural sprites so the map is playable with replaceable per-building objects.
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / "apps/client/public/assets/buildings"

# id, name, accent RGB, footprint bias
BUILDINGS = [
    ("b02", "path", (242, 201, 120), "wide"),
    ("b03", "workshop", (180, 120, 70), "box"),
    ("b04", "pier", (90, 180, 200), "wide"),
    ("b05", "cafe", (255, 140, 100), "box"),
    ("b06", "palms", (50, 170, 90), "wide"),
    ("b07", "bungalow", (255, 190, 120), "cluster"),
    ("b08", "viewpoint", (120, 160, 200), "tall"),
    ("b09", "market", (255, 120, 140), "wide"),
    ("b10", "fountain", (180, 220, 255), "round"),
    ("b11", "post", (200, 160, 90), "box"),
    ("b12", "club", (90, 140, 200), "box"),
    ("b13", "bridge", (160, 110, 70), "wide"),
    ("b14", "bar", (255, 150, 80), "box"),
    ("b15", "garden", (120, 220, 140), "wide"),
    ("b16", "explorer", (140, 110, 80), "box"),
    ("b17", "stage", (255, 100, 140), "wide"),
    ("b18", "hotel", (240, 230, 220), "tall"),
    ("b19", "tower", (170, 140, 100), "tall"),
    ("b20", "lighthouse", (240, 120, 90), "tall"),
]

STYLES = {
    "tropical": {"wall": (210, 160, 90), "roof": (50, 160, 90), "accent": (255, 120, 100)},
    "luxury": {"wall": (245, 245, 245), "roof": (40, 170, 180), "accent": (230, 190, 80)},
    "fantasy": {"wall": (200, 170, 230), "roof": (255, 140, 200), "accent": (120, 255, 220)},
}


def iso_box(d: ImageDraw.ImageDraw, cx, cy, w, dpth, h, wall, roof, top=None):
    # classic 2.5D box
    left = [
        (cx - w, cy),
        (cx, cy + dpth // 2),
        (cx, cy + dpth // 2 - h),
        (cx - w, cy - h),
    ]
    right = [
        (cx + w, cy),
        (cx, cy + dpth // 2),
        (cx, cy + dpth // 2 - h),
        (cx + w, cy - h),
    ]
    roof_pts = [
        (cx - w, cy - h),
        (cx, cy + dpth // 2 - h),
        (cx + w, cy - h),
        (cx, cy - dpth // 2 - h),
    ]
    shade = tuple(max(0, c - 35) for c in wall) + (255,)
    d.polygon(left, fill=wall + (255,))
    d.polygon(right, fill=shade)
    d.polygon(roof_pts, fill=(roof if top is None else top) + (255,))


def draw_state(bid: str, kind: str, state: str, style: str | None, accent) -> Image.Image:
    size = 512
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = 256, 300
    st = STYLES[style or "tropical"]
    wall, roof, acc = st["wall"], st["roof"], st["accent"]
    if state == "s0":
        wall, roof, acc = (120, 110, 90), (90, 85, 70), (100, 90, 70)
    elif state == "s1":
        wall, roof = (170, 140, 100), (140, 120, 80)

    # ground shadow
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse((cx - 110, cy + 10, cx + 110, cy + 50), fill=(0, 0, 0, 55))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    im.alpha_composite(shadow)

    if kind == "wide":
        iso_box(d, cx, cy, 120, 70, 40 if state != "s0" else 18, wall, roof)
        if state != "s0":
            d.line([(cx - 100, cy - 10), (cx + 100, cy - 10)], fill=acc + (255,), width=6)
    elif kind == "tall":
        iso_box(d, cx, cy, 70, 60, 140 if state == "s3" else (70 if state == "s1" else 35), wall, roof)
        if bid == "b20" and state == "s3":
            d.ellipse((cx - 18, cy - 170, cx + 18, cy - 134), fill=(255, 230, 120, 255))
    elif kind == "round":
        d.ellipse((cx - 70, cy - 30, cx + 70, cy + 40), fill=wall + (255,))
        if state == "s3":
            d.ellipse((cx - 30, cy - 70, cx + 30, cy - 10), fill=(200, 240, 255, 220))
            d.ellipse((cx - 12, cy - 90, cx + 12, cy - 66), fill=acc + (255,))
    elif kind == "cluster":
        for ox, oy, sc in [(-55, 10, 0.8), (50, 5, 0.85), (0, -10, 1.0)]:
            iso_box(d, cx + ox, cy + oy, int(55 * sc), int(45 * sc), int((50 if state != "s0" else 20) * sc), wall, roof)
    else:  # box
        iso_box(d, cx, cy, 90, 70, 80 if state == "s3" else (45 if state == "s1" else 22), wall, roof)
        if state == "s3":
            d.rectangle((cx - 18, cy - 40, cx + 10, cy - 10), fill=(80, 180, 220, 255))

    if state == "s0":
        # rubble
        for i in range(6):
            x = cx - 80 + i * 28
            d.ellipse((x, cy + 8, x + 18, cy + 20), fill=(110, 100, 80, 200))
    if state == "s1":
        d.line([(cx - 60, cy - 90), (cx - 20, cy - 20)], fill=(160, 120, 70, 255), width=5)
        d.line([(cx + 50, cy - 85), (cx + 15, cy - 20)], fill=(160, 120, 70, 255), width=5)

    # small accent badge from catalog color
    d.ellipse((cx + 70, cy - 100, cx + 100, cy - 70), fill=accent + (230,))
    return im


def main() -> None:
    for bid, _name, accent, kind in BUILDINGS:
        folder = OUT / bid
        folder.mkdir(parents=True, exist_ok=True)
        for state in ("s0", "s1", "s3"):
            if state == "s3":
                for style in ("tropical", "luxury", "fantasy"):
                    im = draw_state(bid, kind, state, style, accent)
                    path = folder / f"{bid}_s3_{style}.webp"
                    im.save(path, "WEBP", quality=88, method=6)
            else:
                im = draw_state(bid, kind, state, "tropical", accent)
                path = folder / f"{bid}_{state}.webp"
                im.save(path, "WEBP", quality=88, method=6)
        print("building", bid)


if __name__ == "__main__":
    main()
