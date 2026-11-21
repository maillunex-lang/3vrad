#!/usr/bin/env python3
"""Remove near-white/flat backgrounds and export game-ready WebP sprites."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = Path("/opt/cursor/artifacts/assets")
OUT = ROOT / "apps/client/public/assets"


def flood_alpha(im: Image.Image, thresh: int = 245, fuzz: int = 28) -> Image.Image:
    """Make near-background corners transparent via flood fill from edges."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    assert px is not None

    def is_bg(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        if a < 10:
            return True
        # bright studio / checker-ish backgrounds
        if r >= thresh and g >= thresh and b >= thresh:
            return True
        # pale cyan/gray studio
        if min(r, g, b) > 200 and max(r, g, b) - min(r, g, b) < fuzz:
            return True
        return False

    visited = set()
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    while stack:
        x, y = stack.pop()
        if (x, y) in visited or not (0 <= x < w and 0 <= y < h):
            continue
        visited.add((x, y))
        if not is_bg(x, y):
            continue
        px[x, y] = (0, 0, 0, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    # Soften fringe
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r > 235 and g > 235 and b > 235:
                px[x, y] = (r, g, b, max(0, a - 180))
    return im


def autocrop(im: Image.Image, pad: int = 8) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def fit_square(im: Image.Image, size: int = 512) -> Image.Image:
    im = autocrop(im)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = min(size / im.width, size / im.height) * 0.92
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(resized, ((size - nw) // 2, (size - nh) // 2), resized)
    return canvas


def process_one(src: Path, dest: Path, size: int = 512) -> dict:
    raw = Image.open(src)
    cleaned = flood_alpha(raw)
    fitted = fit_square(cleaned, size)
    dest.parent.mkdir(parents=True, exist_ok=True)
    fitted.save(dest, "WEBP", quality=90, method=6)
    return {
        "src": str(src),
        "dest": str(dest.relative_to(ROOT)),
        "size": fitted.size,
        "bytes": dest.stat().st_size,
    }


MAP = [
    ("b01_s0_ruins.jpg", "buildings/b01/b01_s0_ruins.webp", 512),
    ("b01_s1_repair.jpg", "buildings/b01/b01_s1_repair.webp", 512),
    ("b01_s3_tropical.jpg", "buildings/b01/b01_s3_tropical.webp", 512),
    ("b01_s3_luxury.jpg", "buildings/b01/b01_s3_luxury.webp", 512),
    ("b01_s3_fantasy.jpg", "buildings/b01/b01_s3_fantasy.webp", 512),
    ("gem_mango.jpg", "match3/gem_mango.webp", 256),
    ("gem_dragon.jpg", "match3/gem_dragon.webp", 256),
    ("gem_lime.jpg", "match3/gem_lime.webp", 256),
    ("gem_passion.jpg", "match3/gem_passion.webp", 256),
    ("gem_blue.jpg", "match3/gem_blue.webp", 256),
    ("power_rocket.jpg", "match3/power_rocket.webp", 256),
    ("power_bomb.jpg", "match3/power_bomb.webp", 256),
    ("power_pearl.jpg", "match3/power_pearl.webp", 256),
    ("power_propeller.jpg", "match3/power_propeller.webp", 256),
]


def main() -> int:
    results = []
    for name, rel, size in MAP:
        src = SRC / name
        if not src.exists():
            # try png
            alt = SRC / name.replace(".jpg", ".png")
            src = alt if alt.exists() else src
        if not src.exists():
            print(f"MISSING {name}", file=sys.stderr)
            continue
        dest = OUT / rel
        info = process_one(src, dest, size)
        results.append(info)
        print(f"OK {rel} ({info['bytes']} bytes)")
    report = OUT / "catalog" / "process_report.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(results, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
