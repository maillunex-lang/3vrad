#!/usr/bin/env python3
"""Richer TEMP isometric buildings B02–B20 — distinct silhouettes per catalog role.

Still WIP / not final Premium Stylized. Original project-owned procedural art.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / "apps/client/public/assets/buildings"

STYLES = {
    "tropical": {"wall": (222, 168, 98), "roof": (46, 168, 98), "accent": (255, 110, 100), "trim": (255, 210, 120)},
    "luxury": {"wall": (248, 246, 240), "roof": (30, 170, 185), "accent": (220, 180, 70), "trim": (90, 200, 210)},
    "fantasy": {"wall": (198, 168, 230), "roof": (255, 130, 190), "accent": (110, 255, 220), "trim": (255, 220, 255)},
}


def shade(rgb, d=35):
    return tuple(max(0, c - d) for c in rgb)


def shadow(im, cx, cy, rx=120, ry=28):
    s = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(s)
    d.ellipse((cx - rx, cy, cx + rx, cy + ry * 2), fill=(0, 0, 0, 50))
    im.alpha_composite(s.filter(ImageFilter.GaussianBlur(7)))


def iso_box(d, cx, cy, w, depth, h, wall, roof):
    left = [(cx - w, cy), (cx, cy + depth // 2), (cx, cy + depth // 2 - h), (cx - w, cy - h)]
    right = [(cx + w, cy), (cx, cy + depth // 2), (cx, cy + depth // 2 - h), (cx + w, cy - h)]
    top = [(cx - w, cy - h), (cx, cy + depth // 2 - h), (cx + w, cy - h), (cx, cy - depth // 2 - h)]
    d.polygon(left, fill=wall + (255,))
    d.polygon(right, fill=shade(wall) + (255,))
    d.polygon(top, fill=roof + (255,))


def palm(d, x, y, scale=1.0, green=(40, 160, 90)):
    trunk = (150, 110, 60, 255)
    d.line([(x, y), (x, y - int(70 * scale))], fill=trunk, width=max(3, int(6 * scale)))
    for a in (-35, -10, 15, 40):
        import math
        rad = math.radians(a - 90)
        x2 = x + int(math.cos(rad) * 40 * scale)
        y2 = y - int(70 * scale) + int(math.sin(rad) * 28 * scale)
        d.line([(x, y - int(70 * scale)), (x2, y2)], fill=green + (255,), width=max(3, int(5 * scale)))


def draw_building(bid: str, state: str, style: str) -> Image.Image:
    size = 512
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = 256, 310
    st = STYLES[style]
    wall, roof, acc, trim = st["wall"], st["roof"], st["accent"], st["trim"]
    if state == "s0":
        wall, roof, acc, trim = (125, 115, 95), (95, 90, 75), (110, 100, 85), (130, 120, 100)
    elif state == "s1":
        wall, roof = shade(wall, -20), shade(roof, 20)

    shadow(im, cx, cy + 8)
    h_s3 = state == "s3"
    h_s1 = state == "s1"

    if bid == "b02":  # beach path
        for i in range(5):
            ox = -140 + i * 70
            col = trim if h_s3 else wall
            d.polygon(
                [(cx + ox, cy), (cx + ox + 40, cy + 18), (cx + ox + 70, cy), (cx + ox + 40, cy - 18)],
                fill=col + (255,),
            )
        if h_s3:
            palm(d, cx - 90, cy - 10, 0.7)
            palm(d, cx + 100, cy - 5, 0.75)
    elif bid == "b03":  # workshop
        iso_box(d, cx, cy, 100, 80, 30 if state == "s0" else (55 if h_s1 else 95), wall, roof)
        if h_s3:
            d.rectangle((cx - 25, cy - 55, cx + 5, cy - 15), fill=(80, 170, 210, 255))
            d.polygon([(cx + 40, cy - 20), (cx + 70, cy - 50), (cx + 55, cy - 10)], fill=trim + (255,))
            d.ellipse((cx - 70, cy + 5, cx - 40, cy + 30), fill=(180, 80, 40, 255))  # crab hint
    elif bid == "b04":  # pier
        for i in range(4):
            iso_box(d, cx - 60 + i * 45, cy - i * 8, 35, 50, 18 if state == "s0" else 28, wall, shade(wall, 10))
        if h_s3:
            d.ellipse((cx + 80, cy - 40, cx + 130, cy - 10), fill=(70, 180, 210, 200))
            d.rectangle((cx + 95, cy - 70, cx + 105, cy - 40), fill=(160, 120, 70, 255))
    elif bid == "b05":  # cafe
        iso_box(d, cx, cy, 95, 75, 25 if state == "s0" else (50 if h_s1 else 85), wall, roof)
        if not state == "s0":
            d.ellipse((cx - 35, cy - (70 if h_s3 else 40), cx + 35, cy - (40 if h_s3 else 15)), fill=(90, 60, 40, 255))
            d.ellipse((cx - 28, cy - (95 if h_s3 else 60), cx + 28, cy - (55 if h_s3 else 30)), fill=(50, 150, 80, 255))
        if h_s3:
            d.rectangle((cx - 50, cy + 5, cx - 20, cy + 35), fill=acc + (255,))
            d.rectangle((cx + 15, cy + 5, cx + 45, cy + 35), fill=trim + (255,))
    elif bid == "b06":  # palm avenue
        for ox in (-120, -40, 40, 120):
            palm(d, cx + ox, cy + 10, 0.55 if state == "s0" else (0.85 if h_s3 else 0.7), roof if h_s3 else (80, 120, 70))
        d.polygon([(cx - 150, cy + 20), (cx, cy + 40), (cx + 150, cy + 20), (cx, cy)], fill=trim + (200,))
    elif bid == "b07":  # bungalows
        for ox, oy, sc in [(-70, 15, 0.85), (65, 10, 0.9), (0, -15, 1.05)]:
            hh = int((22 if state == "s0" else (40 if h_s1 else 70)) * sc)
            iso_box(d, cx + ox, cy + oy, int(55 * sc), int(48 * sc), hh, wall, roof)
            if h_s3:
                d.rectangle((cx + ox - 12, cy + oy - int(hh * 0.4), cx + ox + 8, cy + oy - 5), fill=(70, 170, 210, 255))
    elif bid == "b08":  # viewpoint
        iso_box(d, cx, cy, 80, 70, 20 if state == "s0" else 35, wall, shade(wall))
        if state != "s0":
            d.polygon([(cx - 50, cy - 30), (cx + 50, cy - 30), (cx + 40, cy - 90 if h_s3 else -55), (cx - 40, cy - 90 if h_s3 else -55)], fill=roof + (230,))
        if h_s3:
            d.ellipse((cx - 15, cy - 110, cx + 15, cy - 80), fill=acc + (255,))
    elif bid == "b09":  # market
        for ox in (-70, 0, 70):
            iso_box(d, cx + ox, cy, 40, 55, 18 if state == "s0" else (35 if h_s1 else 55), wall, roof)
        if h_s3:
            d.ellipse((cx - 20, cy - 70, cx + 20, cy - 40), fill=acc + (255,))
            d.ellipse((cx - 90, cy + 5, cx - 60, cy + 30), fill=(255, 180, 200, 255))
    elif bid == "b10":  # fountain
        d.ellipse((cx - 90, cy - 10, cx + 90, cy + 50), fill=shade(wall, 10) + (255,))
        d.ellipse((cx - 60, cy - 25, cx + 60, cy + 25), fill=(160, 210, 235, 220))
        if h_s3:
            d.ellipse((cx - 22, cy - 80, cx + 22, cy - 36), fill=(230, 250, 255, 230))
            d.ellipse((cx - 10, cy - 105, cx + 10, cy - 85), fill=trim + (255,))
        elif h_s1:
            d.ellipse((cx - 15, cy - 50, cx + 15, cy - 20), fill=(180, 220, 240, 200))
    elif bid == "b11":  # post
        iso_box(d, cx, cy, 85, 70, 25 if state == "s0" else (50 if h_s1 else 80), wall, roof)
        if h_s3:
            d.rectangle((cx - 20, cy - 50, cx + 20, cy - 10), fill=(90, 150, 200, 255))
            d.polygon([(cx + 50, cy - 60), (cx + 90, cy - 40), (cx + 50, cy - 20)], fill=acc + (255,))
    elif bid == "b12":  # travelers club
        iso_box(d, cx, cy, 110, 85, 28 if state == "s0" else (55 if h_s1 else 100), wall, roof)
        if h_s3:
            d.ellipse((cx - 25, cy - 120, cx + 25, cy - 70), fill=trim + (255,))
            d.polygon([(cx - 15, cy - 95), (cx, cy - 115), (cx + 15, cy - 95)], fill=acc + (255,))
    elif bid == "b13":  # bridge
        d.polygon([(cx - 160, cy + 10), (cx - 40, cy - 30), (cx + 40, cy - 30), (cx + 160, cy + 10), (cx + 40, cy + 25), (cx - 40, cy + 25)], fill=wall + (255,))
        if state != "s0":
            d.line([(cx - 120, cy - 5), (cx - 40, cy - 45)], fill=trim + (255,), width=5)
            d.line([(cx + 120, cy - 5), (cx + 40, cy - 45)], fill=trim + (255,), width=5)
        if h_s3:
            d.ellipse((cx - 30, cy + 20, cx + 30, cy + 45), fill=(60, 160, 200, 180))
    elif bid == "b14":  # lagoon bar
        iso_box(d, cx, cy, 100, 70, 25 if state == "s0" else (48 if h_s1 else 75), wall, roof)
        if h_s3:
            d.ellipse((cx - 50, cy - 20, cx + 50, cy + 20), fill=(40, 40, 50, 200))
            for ox in (-35, 0, 35):
                d.ellipse((cx + ox - 8, cy - 35, cx + ox + 8, cy - 15), fill=acc + (255,))
    elif bid == "b15":  # firefly garden
        for ox, oy in [(-80, 10), (-20, -20), (50, 5), (100, -15), (-50, 30)]:
            d.ellipse((cx + ox, cy + oy, cx + ox + 35, cy + oy + 20), fill=roof + (200,))
        if h_s3:
            for ox, oy in [(-40, -40), (10, -55), (60, -35), (-10, -20)]:
                d.ellipse((cx + ox, cy + oy, cx + ox + 10, cy + oy + 10), fill=trim + (230,))
    elif bid == "b16":  # explorer hut
        iso_box(d, cx, cy, 90, 75, 28 if state == "s0" else (50 if h_s1 else 88), wall, roof)
        if h_s3:
            d.rectangle((cx + 40, cy - 40, cx + 85, cy + 10), fill=shade(wall) + (255,))
            d.ellipse((cx - 15, cy - 70, cx + 25, cy - 40), fill=(200, 180, 120, 255))
    elif bid == "b17":  # festival stage
        iso_box(d, cx, cy + 20, 130, 60, 18 if state == "s0" else 30, wall, shade(wall))
        if state != "s0":
            d.polygon([(cx - 100, cy - 10), (cx + 100, cy - 10), (cx + 80, cy - (70 if h_s3 else 40)), (cx - 80, cy - (70 if h_s3 else 40))], fill=roof + (230,))
        if h_s3:
            d.ellipse((cx - 20, cy - 50, cx + 20, cy - 20), fill=acc + (255,))
    elif bid == "b18":  # hotel
        floors = 1 if state == "s0" else (2 if h_s1 else 4)
        for i in range(floors):
            iso_box(d, cx, cy - i * 45, 100, 80, 42, wall if i % 2 == 0 else shade(wall, -15), roof if i == floors - 1 else shade(wall, 20))
        if h_s3:
            for fy in range(3):
                for fx in (-40, 10):
                    d.rectangle((cx + fx, cy - 30 - fy * 45, cx + fx + 22, cy - 10 - fy * 45), fill=(90, 190, 220, 255))
    elif bid == "b19":  # observation tower
        iso_box(d, cx, cy, 55, 55, 30 if state == "s0" else (80 if h_s1 else 150), wall, roof)
        if h_s3:
            d.ellipse((cx - 35, cy - 170, cx + 35, cy - 130), fill=trim + (230,))
            d.rectangle((cx - 8, cy - 130, cx + 8, cy - 90), fill=shade(wall) + (255,))
    elif bid == "b20":  # lighthouse
        iso_box(d, cx, cy, 60, 60, 35 if state == "s0" else (90 if h_s1 else 160), wall, roof)
        if h_s3:
            d.ellipse((cx - 28, cy - 185, cx + 28, cy - 145), fill=(255, 230, 120, 255))
            d.ellipse((cx - 14, cy - 200, cx + 14, cy - 175), fill=(255, 250, 200, 230))
            d.rectangle((cx - 50, cy + 5, cx + 50, cy + 25), fill=(80, 150, 190, 180))
    else:
        iso_box(d, cx, cy, 90, 70, 40 if state == "s0" else 80, wall, roof)

    if state == "s0":
        for i in range(7):
            x = cx - 90 + i * 28
            d.ellipse((x, cy + 12, x + 16, cy + 24), fill=(105, 95, 75, 210))
    if state == "s1":
        d.line([(cx - 70, cy - 100), (cx - 25, cy - 25)], fill=(150, 110, 60, 255), width=6)
        d.line([(cx + 65, cy - 95), (cx + 20, cy - 25)], fill=(150, 110, 60, 255), width=6)

    return im


def main() -> None:
    ids = [f"b{i:02d}" for i in range(2, 21)]
    for bid in ids:
        folder = OUT / bid
        folder.mkdir(parents=True, exist_ok=True)
        for state in ("s0", "s1", "s3"):
            if state == "s3":
                for style in STYLES:
                    im = draw_building(bid, state, style)
                    im.save(folder / f"{bid}_s3_{style}.webp", "WEBP", quality=90, method=6)
            else:
                im = draw_building(bid, state, "tropical")
                im.save(folder / f"{bid}_{state}.webp", "WEBP", quality=90, method=6)
        print("ok", bid)


if __name__ == "__main__":
    main()
