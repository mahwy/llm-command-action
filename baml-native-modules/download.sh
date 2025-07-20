#!/bin/bash

# Download script for BAML native modules
# This script downloads all platform-specific native modules for @boundaryml/baml

set -e

# Default version - update this when upgrading BAML
VERSION="${1:-0.201.0}"

echo "Downloading BAML native modules version $VERSION..."

# Base URL for npm registry
BASE_URL="https://registry.npmjs.org/@boundaryml"

# Array of platform-specific modules
MODULES=(
    "baml-linux-arm64-gnu"
    "baml-linux-arm64-musl"
    # Uncomment these if you need them
    #"baml-darwin-arm64"
    # "baml-darwin-x64"    
    # "baml-linux-x64-gnu"
    # "baml-linux-x64-musl"
    # "baml-win32-x64-msvc"
)

# Clean up existing modules
echo "Cleaning up existing modules..."
for module in "${MODULES[@]}"; do
    if [ -d "$module" ]; then
        rm -rf "$module"
    fi
done

# Download and extract each module
for module in "${MODULES[@]}"; do
    echo "Downloading $module@$VERSION..."
    
    # Download tarball
    curl -L "$BASE_URL/$module/-/$module-$VERSION.tgz" -o "$module-$VERSION.tgz"
    
    # Extract tarball
    tar -xzf "$module-$VERSION.tgz"
    
    # Rename package directory to module name
    mv package "$module"
    
    # Clean up tarball
    rm "$module-$VERSION.tgz"
    
    echo "✅ $module downloaded and extracted"
done

echo ""
echo "🎉 All BAML native modules downloaded successfully!"
echo "📁 Modules saved in: $(pwd)"
echo ""
echo "Downloaded modules:"
for module in "${MODULES[@]}"; do
    echo "  - $module/"
done