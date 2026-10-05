import math
from PIL import Image, ImageDraw

width = 1200
height = 800
img = Image.new("RGBA", (width, height), (10, 10, 10, 255))
draw = ImageDraw.Draw(img)

spacing = 16
dotRadius = 1.5
time = 1.5

cols = int(width / spacing)
rows = int(height / spacing)

offsetX = (width - cols * spacing) / 2
offsetY = (height - rows * spacing) / 2

for i in range(cols + 1):
    for j in range(rows + 1):
        x = offsetX + i * spacing
        y = offsetY + j * spacing

        nx = i * 0.1
        ny = j * 0.1

        wave1 = math.sin(nx + time * 0.5) * math.cos(ny - time * 0.3)
        wave2 = math.sin(nx * 0.5 - ny * 0.5 + time * 0.8)
        value = wave1 + wave2

        if value > 0.1:
            highlightCheck = math.sin(i * 12.34) * math.cos(j * 56.78)

            if highlightCheck > 0.98:
                color = (59, 130, 246, 255) # Blue #3b82f6
            elif highlightCheck < -0.98:
                color = (139, 92, 246, 255) # Purple #8b5cf6
            else:
                alpha = int(min(0.6, (value - 0.1) * 0.8) * 255)
                color = (148, 163, 184, alpha)

            r = dotRadius
            draw.ellipse([x - r, y - r, x + r, y + r], fill=color)

img.save(r"C:\Users\aditya\.gemini\antigravity-ide\scratch\codemind-ai-main\scratch\signal_particles_rendered.png")
print("Rendered signal_particles_rendered.png successfully!")
