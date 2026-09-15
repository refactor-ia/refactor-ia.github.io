"""Generate public/ brand assets from the RefactorIA logo sources.

Sources (living in the refactoria content repository):
  - assets/build/refactoria.svg              potrace vector of the beard logo
  - assets/build/FiraCodeNerdFontMonoBeard-Reg.ttf  brand mono font

Outputs (written to public/):
  - favicon.svg, favicon-512.png, apple-touch-icon.png
  - og-image.png (1200x630, used for Open Graph and Twitter cards)

Requirements: python3 with cairosvg and Pillow. Run from the repository root:
  python3 scripts/generate-assets.py
"""

import io
import re

import cairosvg
from PIL import Image, ImageDraw, ImageFont

SRC_SVG = '/home/jbarbat/dev/refactoria/assets/build/refactoria.svg'
FONT = '/home/jbarbat/dev/refactoria/assets/build/FiraCodeNerdFontMonoBeard-Reg.ttf'
PUB = 'public'

DARK = '#0b0714'
WHITE = '#f2effa'
VIOLET = '#7127ff'
VIOLET_SOFT = '#9d6bff'
MUTED = '#a89fbd'
SUBTLE = '#6f6788'


def main():
    svg = open(SRC_SVG).read()
    d = re.search(r'd="([^"]+)"', svg, re.S).group(1)
    transform = 'translate(0.000000,2000.000000) scale(0.100000,-0.100000)'

    def make(rect_fill, path_fill):
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 2000">\n'
            f'<rect width="2000" height="2000" fill="{rect_fill}"/>\n'
            f'<g transform="{transform}" fill="{path_fill}" stroke="none">'
            f'<path d="{d}"/></g>\n</svg>'
        )

    def white_frac(png_bytes):
        im = Image.open(io.BytesIO(png_bytes)).convert('RGB')
        px = list(im.getdata())
        return sum(1 for p in px if p[0] > 110) / len(px)

    # potrace may have traced the beard or its background; keep the variant
    # that reads as a white beard on the dark canvas (minority of light pixels).
    cand_a = make(DARK, WHITE)
    cand_b = make(WHITE, DARK)
    frac_a = white_frac(cairosvg.svg2png(bytestring=cand_a.encode(), output_width=256))
    frac_b = white_frac(cairosvg.svg2png(bytestring=cand_b.encode(), output_width=256))
    chosen, mode = (cand_a, 'A') if frac_a <= frac_b else (cand_b, 'B')
    print(f'white_frac A={frac_a:.3f} B={frac_b:.3f} -> variant {mode}')

    with open(f'{PUB}/favicon.svg', 'w') as f:
        f.write(chosen)

    for name, size in [('favicon-512.png', 512), ('apple-touch-icon.png', 180)]:
        cairosvg.svg2png(
            bytestring=chosen.encode(), write_to=f'{PUB}/{name}',
            output_width=size, output_height=size,
        )
        print(f'{name} ok')

    # Beard sprite with luminance-based alpha for the OG image.
    im = Image.open(
        io.BytesIO(cairosvg.svg2png(bytestring=chosen.encode(), output_width=1024))
    ).convert('RGB')
    sprite = Image.new('RGBA', im.size, (0, 0, 0, 0))
    sp, ip = sprite.load(), im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = ip[x, y]
            lum = (r * 299 + g * 587 + b * 114) // 1000
            a = 0 if lum < 30 else min(255, int((lum - 30) * 255 / 80))
            if a:
                sp[x, y] = (242, 239, 250, a)
    sprite = sprite.crop(sprite.getbbox())

    og = Image.new('RGB', (1200, 630), DARK)
    target_h = 500
    beard = sprite.resize(
        (int(sprite.width * target_h / sprite.height), target_h), Image.LANCZOS
    )
    og.paste(beard, (1200 - beard.width - 70, (630 - beard.height) // 2), beard)

    draw = ImageDraw.Draw(og)
    f_big = ImageFont.truetype(FONT, 84)
    f_tag = ImageFont.truetype(FONT, 34)
    f_url = ImageFont.truetype(FONT, 28)
    x = 90
    draw.rectangle([x, 128, x + 10, 168], fill=VIOLET)
    draw.text((x + 34, 118), 'RefactorIA', font=f_big, fill=WHITE)
    draw.rectangle([x, 248, x + 560, 252], fill=VIOLET)
    draw.text((x, 300), 'Modernize with engineering', font=f_tag, fill=MUTED)
    draw.text((x, 350), 'judgment. No hype.', font=f_tag, fill=VIOLET_SOFT)
    draw.text((x, 545), 'refactoria.dev', font=f_url, fill=SUBTLE)
    og.save(f'{PUB}/og-image.png', optimize=True)
    print('og-image.png ok')


if __name__ == '__main__':
    main()
