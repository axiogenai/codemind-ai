from PIL import Image, ImageDraw

width = 800
height = 600
img = Image.new("RGBA", (width, height), (10, 10, 10, 255))
draw = ImageDraw.Draw(img)

# Card background
draw.rounded_rectangle([40, 40, width-40, height-40], radius=16, fill=(17, 18, 21, 255), outline=(35, 36, 42, 255))

options = [
    ("Option 1: Soft Tinted Signal (18% Blue, 30% border)", (30, 48, 80, 255), (59, 130, 246, 90), (147, 197, 253, 255)),
    ("Option 2: Soft Slate Indigo (#2c3444, border #3d475c)", (44, 52, 68, 255), (61, 71, 92, 255), (224, 231, 255, 255)),
    ("Option 3: Soft Deep Sky (#1d3b5c, border #2d5580)", (29, 59, 92, 255), (45, 85, 128, 255), (186, 230, 253, 255)),
    ("Option 4: Soft Muted Zinc (#27272a, border #3f3f46)", (39, 39, 42, 255), (63, 63, 70, 255), (244, 244, 245, 255)),
]

y = 80
for title, fill, outline, text_color in options:
    draw.text((60, y), title, fill=(161, 161, 170, 255))
    draw.rounded_rectangle([60, y + 25, width - 60, y + 75], radius=12, fill=fill, outline=outline, width=1)
    draw.text((width // 2 - 80, y + 43), "Scan & Reverse Engineer", fill=text_color)
    y += 115

img.save(r"C:\Users\aditya\.gemini\antigravity-ide\scratch\codemind-ai-main\scratch\soft_button_comparison.png")
print("Saved soft_button_comparison.png")
