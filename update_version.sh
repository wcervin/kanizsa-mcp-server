#!/bin/bash

# Update Version References for Kanizsa MCP Server
# This script reads the VERSION file and updates all version references across the codebase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if VERSION file exists
if [[ ! -f "VERSION" ]]; then
    print_error "VERSION file not found!"
    exit 1
fi

# Read version from VERSION file
VERSION=$(cat VERSION)
print_status "Updating all version references to: $VERSION"

# Update package.json
print_status "Updating package.json..."
sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" package.json

# Update TypeScript source files
print_status "Updating TypeScript source files..."
find src/ -name "*.ts" -type f -exec sed -i '' "s/version: '[0-9]\+\.[0-9]\+\.[0-9]\+'/version: '$VERSION'/g" {} \;
find src/ -name "*.ts" -type f -exec sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" {} \;
find src/ -name "*.ts" -type f -exec sed -i '' "s/VERSION = \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/VERSION = \"$VERSION\"/g" {} \;

# Update Dockerfile
print_status "Updating Dockerfile..."
sed -i '' "s/LABEL version=\"[0-9]\+\.[0-9]\+\.[0-9]\+\"/LABEL version=\"$VERSION\"/g" Dockerfile
sed -i '' "s/ARG VERSION=[0-9]\+\.[0-9]\+\.[0-9]\+/ARG VERSION=$VERSION/g" Dockerfile

# Update README.md
print_status "Updating README.md..."
sed -i '' "s/Version: [0-9]\+\.[0-9]\+\.[0-9]\+/Version: $VERSION/g" README.md
sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" README.md

# Update test files
print_status "Updating test files..."
if [[ -f "test-improvements.js" ]]; then
    sed -i '' "s/version: '[0-9]\+\.[0-9]\+\.[0-9]\+'/version: '$VERSION'/g" test-improvements.js
    sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" test-improvements.js
fi

# Update any documentation files
print_status "Updating documentation files..."
find . -name "*.md" -type f -exec sed -i '' "s/Version: [0-9]\+\.[0-9]\+\.[0-9]\+/Version: $VERSION/g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" {} \;

print_success "All version references updated to $VERSION!"
print_status "Files updated:"
echo "  - package.json"
echo "  - src/*.ts files"
echo "  - Dockerfile"
echo "  - README.md"
echo "  - test-improvements.js"
echo "  - *.md documentation files"

print_status "Version $VERSION is now consistent across the MCP Server codebase!"
