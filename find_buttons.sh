#!/bin/bash
# Script to find all button elements that need custom tooltips

echo "=== BUTTON ANALYSIS REPORT ==="
echo ""

# Find all TSX/JSX files with buttons
find src -name "*.tsx" -o -name "*.jsx" | while read file; do
    if grep -q "<button" "$file"; then
        echo "FILE: $file"
        echo "Buttons found:"
        grep -n "className.*neon-btn" "$file" | head -10
        echo ""
    fi
done
