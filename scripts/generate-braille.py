"""Generate the braille art of the RefactorIA logo from the brand source image.

Source: RefactorIA-Front.png (the beard logo, white on dark) from the
refactoria content repository. Output: src/assets/generated/logo-braille.txt
(each line is one row of Unicode braille characters, rendered white-on-dark).

Requirements: python3 with Pillow. Run from the repository root:
  python3 scripts/generate-braille.py [cols]

Braille cell layout (U+2800 + bits):
  dot1 (0,0)=0x01  dot4 (1,0)=0x08
  dot2 (0,1)=0x02  dot5 (1,1)=0x10
  dot3 (0,2)=0x04  dot6 (1,2)=0x20
  dot7 (0,3)=0x40  dot8 (1,3)=0x80
"""

import sys
from pathlib import Path

from PIL import Image

SRC = "/home/jbarbat/dev/refactoria/assets/RefactorIA-Front.png"
OUT = Path("src/assets/generated/logo-braille.txt")
THRESHOLD = 110
PAD = 0.04

DOT_BITS = {
    (0, 0): 0x01,
    (0, 1): 0x02,
    (0, 2): 0x04,
    (1, 0): 0x08,
    (1, 1): 0x10,
    (1, 2): 0x20,
    (0, 3): 0x40,
    (1, 3): 0x80,
}


def main() -> None:
    cols = int(sys.argv[1]) if len(sys.argv) > 1 else 56

    im = Image.open(SRC).convert("L")
    mask = im.point(lambda p: 255 if p > THRESHOLD else 0)
    bbox = mask.getbbox()
    assert bbox, "no bright content found in source image"
    im = im.crop(bbox)

    pad = round(max(im.size) * PAD)
    canvas = Image.new("L", (im.width + pad * 2, im.height + pad * 2), 0)
    canvas.paste(im, (pad, pad))
    im = canvas

    w, h = im.size
    rows = max(1, round((h / w) * cols / 2))
    im = im.resize((cols * 2, rows * 4), Image.LANCZOS)
    px = im.load()

    lines = []
    for row in range(rows):
        line = []
        for col in range(cols):
            bits = 0
            for (dx, dy), bit in DOT_BITS.items():
                if px[col * 2 + dx, row * 4 + dy] > THRESHOLD:
                    bits |= bit
            line.append(chr(0x2800 + bits))
        lines.append("".join(line).rstrip())

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n")

    filled = sum(1 for line in lines for ch in line if ch != "\u2800")
    total = sum(len(line) for line in lines)
    print(f"{cols}x{rows} braille written to {OUT} (dot density {filled / total:.2f})")


if __name__ == "__main__":
    main()
