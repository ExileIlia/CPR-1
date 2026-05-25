#!/usr/bin/env python3
"""
Generate simple PNG icons for the PWA.
Run: python3 generate_icons.py
Requires: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os

    SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
    OUTPUT_DIR = "public/icons"
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for size in SIZES:
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Background circle
        margin = size // 10
        draw.ellipse(
            [margin, margin, size - margin, size - margin],
            fill=(44, 62, 80, 255),
        )

        # Checkmark emoji as text
        emoji = "✅"
        font_size = size // 2
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
        except:
            font = ImageFont.load_default()

        # Center the text
        bbox = draw.textbbox((0, 0), "✓", font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (size - tw) // 2
        y = (size - th) // 2 - size // 20

        draw.text((x, y), "✓", font=font, fill=(46, 204, 113, 255))

        filepath = os.path.join(OUTPUT_DIR, f"icon-{size}x{size}.png")
        img.save(filepath, "PNG")
        print(f"Generated: {filepath}")

    print("\nAll icons generated successfully!")

except ImportError:
    print("Pillow not installed. Run: pip install Pillow")
    print("Or use any online icon generator to create icons in public/icons/")
