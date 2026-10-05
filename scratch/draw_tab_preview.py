from PIL import Image, ImageDraw, ImageFont
import math

width = 600
height = 100
img = Image.new("RGBA", (width, height), (17, 18, 21, 255))
draw = ImageDraw.Draw(img)

# Draw container box
draw.rounded_rectangle([20, 20, width - 20, 80], radius=14, fill=(24, 24, 27, 255), outline=(45, 45, 50, 255), width=1)

# Tab 1: Active
draw.rounded_rectangle([24, 24, 196, 76], radius=10, fill=(39, 39, 42, 255), outline=(63, 63, 70, 255), width=1)

# Text and icon labels
# Tab 1: FolderGit2 (Git Folder)
draw.text((45, 42), "[Git-Folder]", fill=(56, 189, 248, 255))
draw.text((120, 42), "Local Folder", fill=(255, 255, 255, 255))

# Tab 2: PackageOpen
draw.text((225, 42), "[Package-Open]", fill=(251, 191, 36, 255))
draw.text((320, 42), "Upload ZIP", fill=(161, 161, 170, 255))

# Tab 3: Radar
draw.text((415, 42), "[Radar-Scan]", fill=(52, 211, 153, 255))
draw.text((495, 42), "Web / URL", fill=(161, 161, 170, 255))

img.save(r"C:\Users\aditya\.gemini\antigravity-ide\scratch\codemind-ai-main\scratch\tab_icons_preview.png")
print("Saved preview!")
