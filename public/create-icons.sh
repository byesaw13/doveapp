#!/bin/bash
# Create placeholder PWA icons
# In production, replace these with actual branded icons

# Create 192x192 icon using ImageMagick if available, otherwise create SVG
if command -v convert &> /dev/null; then
    convert -size 192x192 xc:#2563eb -fill white -pointsize 100 -gravity center -annotate +0+0 "DA" icon-192.png
    convert -size 512x512 xc:#2563eb -fill white -pointsize 300 -gravity center -annotate +0+0 "DA" icon-512.png
else
    # Create SVG placeholders
    cat > icon-192.svg << 'SVGEOF'
<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#2563eb"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="100" font-family="Arial, sans-serif" fill="white">DA</text>
</svg>
SVGEOF
    cat > icon-512.svg << 'SVGEOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="300" font-family="Arial, sans-serif" fill="white">DA</text>
</svg>
SVGEOF
fi
