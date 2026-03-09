#!/bin/bash
# WebP Conversion Script for NJZ Platform
# Converts all JPG/PNG images to WebP format with quality optimization

set -e

echo "🖼️  NJZ Platform WebP Converter"
echo "=============================="
echo ""

# Check for cwebp
if ! command -v cwebp &> /dev/null; then
    echo "⚠️  cwebp not found. Installing..."
    
    # Detect OS and install
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y webp
    elif command -v yum &> /dev/null; then
        sudo yum install -y libwebp-tools
    elif command -v brew &> /dev/null; then
        brew install webp
    else
        echo "❌ Cannot install cwebp automatically. Please install manually:"
        echo "   Ubuntu/Debian: sudo apt-get install webp"
        echo "   CentOS/RHEL: sudo yum install libwebp-tools"
        echo "   macOS: brew install webp"
        exit 1
    fi
fi

echo "✅ cwebp is available"
echo ""

# Configuration
QUALITY=${1:-85}
WEBSITE_DIR="/root/.openclaw/workspace/website"
CONVERTED_COUNT=0
SKIPPED_COUNT=0
TOTAL_SAVED=0

echo "🔧 Settings:"
echo "   Quality: ${QUALITY}%"
echo "   Source: ${WEBSITE_DIR}"
echo ""

# Function to convert single image
convert_image() {
    local input_file="$1"
    local output_file="${input_file%.*}.webp"
    
    # Skip if WebP already exists and is newer
    if [ -f "$output_file" ] && [ "$output_file" -nt "$input_file" ]; then
        echo "  ⏭️  Skipping $(basename "$input_file") (up to date)"
        ((SKIPPED_COUNT++))
        return
    fi
    
    # Get original size
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null || echo "0")
    
    # Convert to WebP
    if cwebp -q "$QUALITY" -quiet "$input_file" -o "$output_file"; then
        local new_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null || echo "0")
        local saved=$((original_size - new_size))
        local percent=$((saved * 100 / original_size))
        
        TOTAL_SAVED=$((TOTAL_SAVED + saved))
        ((CONVERTED_COUNT++))
        
        echo "  ✅ $(basename "$input_file") → $(basename "$output_file") (-${percent}%)"
    else
        echo "  ❌ Failed to convert $(basename "$input_file")"
    fi
}

# Find and convert images
echo "🔍 Scanning for images..."
echo ""

# Hub 1 - SATOR
echo "📁 Hub 1 (SATOR)..."
find "${WEBSITE_DIR}/hub1-sator" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | while read -r img; do
    convert_image "$img"
done

# Hub 2 - ROTAS  
echo ""
echo "📁 Hub 2 (ROTAS)..."
find "${WEBSITE_DIR}/hub2-rotas" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | while read -r img; do
    convert_image "$img"
done

# Hub 3 - Information
echo ""
echo "📁 Hub 3 (Information)..."
find "${WEBSITE_DIR}/hub3-information" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | while read -r img; do
    convert_image "$img"
done

# Hub 4 - Games
echo ""
echo "📁 Hub 4 (Games)..."
find "${WEBSITE_DIR}/hub4-games" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | while read -r img; do
    convert_image "$img"
done

# Main assets
echo ""
echo "📁 Main Assets..."
find "${WEBSITE_DIR}/assets" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | while read -r img; do
    convert_image "$img"
done

# Summary
echo ""
echo "=============================="
echo "📊 Conversion Summary"
echo "=============================="
echo "   Converted: ${CONVERTED_COUNT} images"
echo "   Skipped:   ${SKIPPED_COUNT} images"
echo "   Total saved: $(numfmt --to=iec-i ${TOTAL_SAVED} 2>/dev/null || echo "${TOTAL_SAVED} bytes")"
echo ""
echo "✅ WebP conversion complete!"
echo ""
echo "💡 Next steps:"
echo "   1. Update HTML/CSS to use .webp extensions"
echo "   2. Add fallback <picture> tags for older browsers"
echo "   3. Test image loading in all hubs"