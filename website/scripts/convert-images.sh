#!/bin/bash
# WebP Image Conversion Script
# Usage: ./convert-images.sh [quality]
# Description: Converts PNG, JPG, JPEG images to WebP format

QUALITY=${1:-85}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBSITE_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== WebP Image Conversion ===${NC}"
echo "Quality: $QUALITY"
echo "Website directory: $WEBSITE_DIR"
echo ""

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo -e "${YELLOW}Warning: cwebp not found. Installing...${NC}"
    
    # Try to install cwebp based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        apt-get update && apt-get install -y webp
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install webp
    else
        echo -e "${RED}Error: Please install WebP tools manually${NC}"
        echo "Visit: https://developers.google.com/speed/webp/download"
        exit 1
    fi
fi

# Statistics
TOTAL=0
CONVERTED=0
SKIPPED=0
ERRORS=0

# Find and convert images (excluding node_modules and archive)
find "$WEBSITE_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | grep -v node_modules | grep -v archive | while read img; do
    TOTAL=$((TOTAL + 1))
    
    # Skip if already has webp version
    webp_path="${img%.*}.webp"
    if [ -f "$webp_path" ]; then
        echo -e "${YELLOW}SKIP${NC}: $img (WebP already exists)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Get original file size
    original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
    
    # Convert to WebP
    if cwebp -q $QUALITY "$img" -o "$webp_path" 2>/dev/null; then
        new_size=$(stat -f%z "$webp_path" 2>/dev/null || stat -c%s "$webp_path" 2>/dev/null)
        savings=$((original_size - new_size))
        percent=$((savings * 100 / original_size))
        
        echo -e "${GREEN}OK${NC}: $img -> ${webp_path##*/} (${percent}% smaller)"
        CONVERTED=$((CONVERTED + 1))
    else
        echo -e "${RED}FAIL${NC}: $img"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo -e "${GREEN}=== Conversion Complete ===${NC}"
echo "Total images found: $TOTAL"
echo "Converted: $CONVERTED"
echo "Skipped: $SKIPPED"
echo "Errors: $ERRORS"

# Generate HTML picture element examples
echo ""
echo "Example HTML usage:"
echo '<picture>'
echo '  <source srcset="image.webp" type="image/webp">'
echo '  <source srcset="image.jpg" type="image/jpeg">'
echo '  <img src="image.jpg" alt="Description" loading="lazy">'
echo '</picture>'
