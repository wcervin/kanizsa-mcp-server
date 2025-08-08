#!/bin/bash

# Update Version References for Kanizsa MCP Server
# This script reads the VERSION file and updates all version references across the codebase
# Enhanced to update all documentation for major, minor, and revision bumps

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

# Get current timestamp for documentation updates
TIMESTAMP=$(date '+%B %d, %Y, %H:%M:%S %Z')

# Update package.json
print_status "Updating package.json..."
sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" package.json

# Update Dockerfile
print_status "Updating Dockerfile..."
sed -i '' "s/LABEL version=\"[0-9]\+\.[0-9]\+\.[0-9]\+\"/LABEL version=\"$VERSION\"/g" Dockerfile
sed -i '' "s/ARG VERSION=[0-9]\+\.[0-9]\+\.[0-9]\+/ARG VERSION=$VERSION/g" Dockerfile
sed -i '' "s/# Kanizsa v[0-9]\+\.[0-9]\+\.[0-9]\+/# Kanizsa v$VERSION/g" Dockerfile

# Update README.md with comprehensive version and timestamp updates
print_status "Updating README.md with comprehensive version and timestamp updates..."
sed -i '' "s/Version: [0-9]\+\.[0-9]\+\.[0-9]\+/Version: $VERSION/g" README.md
sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" README.md
sed -i '' "s/\*\*VERSION:\*\* [0-9]\+\.[0-9]\+\.[0-9]\+/\*\*VERSION:\*\* $VERSION/g" README.md
sed -i '' "s/LAST UPDATED: .*/LAST UPDATED: $TIMESTAMP/g" README.md
sed -i '' "s/Last Updated: .*/Last Updated: $TIMESTAMP/g" README.md
sed -i '' "s/Updated: .*/Updated: $TIMESTAMP/g" README.md

# Update API_DOCUMENTATION.md
print_status "Updating API_DOCUMENTATION.md..."
if [[ -f "API_DOCUMENTATION.md" ]]; then
    sed -i '' "s/Version: [0-9]\+\.[0-9]\+\.[0-9]\+/Version: $VERSION/g" API_DOCUMENTATION.md
    sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" API_DOCUMENTATION.md
    sed -i '' "s/\*\*VERSION:\*\* [0-9]\+\.[0-9]\+\.[0-9]\+/\*\*VERSION:\*\* $VERSION/g" API_DOCUMENTATION.md
    sed -i '' "s/LAST UPDATED: .*/LAST UPDATED: $TIMESTAMP/g" API_DOCUMENTATION.md
    sed -i '' "s/Last Updated: .*/Last Updated: $TIMESTAMP/g" API_DOCUMENTATION.md
    sed -i '' "s/Updated: .*/Updated: $TIMESTAMP/g" API_DOCUMENTATION.md
fi

# Update test files
print_status "Updating test files..."
if [[ -f "test-improvements.js" ]]; then
    sed -i '' "s/version: '[0-9]\+\.[0-9]\+\.[0-9]\+'/version: '$VERSION'/g" test-improvements.js
    sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" test-improvements.js
    sed -i '' "s/\* VERSION: [0-9]\+\.[0-9]\+\.[0-9]\+/\* VERSION: $VERSION/g" test-improvements.js
fi

# Update TypeScript source files with comprehensive patterns
print_status "Updating TypeScript source files with comprehensive patterns..."
find src/ -name "*.ts" -type f -exec sed -i '' "s/version: '[0-9]\+\.[0-9]\+\.[0-9]\+'/version: '$VERSION'/g" {} \;
find src/ -name "*.ts" -type f -exec sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" {} \;
find src/ -name "*.ts" -type f -exec sed -i '' "s/VERSION = \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/VERSION = \"$VERSION\"/g" {} \;
find src/ -name "*.ts" -type f -exec sed -i '' "s/\* VERSION: [0-9]\+\.[0-9]\+\.[0-9]\+/\* VERSION: $VERSION/g" {} \;
find src/ -name "*.ts" -type f -exec sed -i '' "s/userAgent: 'Kanizsa-MCP-Client\/[0-9]\+\.[0-9]\+\.[0-9]\+'/userAgent: 'Kanizsa-MCP-Client\/$VERSION'/g" {} \;
find src/ -name "*.ts" -type f -exec sed -i '' "s/VERSION: [0-9]\+\.[0-9]\+\.[0-9]\+/VERSION: $VERSION/g" {} \;
find src/ -name "*.ts" -type f -exec sed -i '' "s/LAST UPDATED: .*/LAST UPDATED: $TIMESTAMP/g" {} \;

# Update any documentation files with comprehensive patterns
print_status "Updating documentation files with comprehensive patterns..."
find . -name "*.md" -type f -exec sed -i '' "s/Version: [0-9]\+\.[0-9]\+\.[0-9]\+/Version: $VERSION/g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s/\*\*VERSION:\*\* [0-9]\+\.[0-9]\+\.[0-9]\+/\*\*VERSION:\*\* $VERSION/g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s/VERSION: [0-9]\+\.[0-9]\+\.[0-9]\+/VERSION: $VERSION/g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s/LAST UPDATED: .*/LAST UPDATED: $TIMESTAMP/g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s/Last Updated: .*/Last Updated: $TIMESTAMP/g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s/Updated: .*/Updated: $TIMESTAMP/g" {} \;

# Update any remaining version patterns in all files
print_status "Updating any remaining version patterns..."
find . -name "*.ts" -type f -exec sed -i '' "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$VERSION/g" {} \;
find . -name "*.js" -type f -exec sed -i '' "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$VERSION/g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$VERSION/g" {} \;

# Update any JSON files that might contain version references
print_status "Updating JSON files..."
find . -name "*.json" -type f -exec sed -i '' "s/\"version\": \"[0-9]\+\.[0-9]\+\.[0-9]\+\"/\"version\": \"$VERSION\"/g" {} \;

# Update any YAML files that might contain version references
print_status "Updating YAML files..."
find . -name "*.yml" -type f -exec sed -i '' "s/version: [0-9]\+\.[0-9]\+\.[0-9]\+/version: $VERSION/g" {} \;
find . -name "*.yaml" -type f -exec sed -i '' "s/version: [0-9]\+\.[0-9]\+\.[0-9]\+/version: $VERSION/g" {} \;

print_success "All version references updated to $VERSION!"
print_status "Files updated:"
echo "  - package.json"
echo "  - src/*.ts files"
echo "  - Dockerfile"
echo "  - README.md"
echo "  - API_DOCUMENTATION.md"
echo "  - test-improvements.js"
echo "  - *.md documentation files"
echo "  - *.json files"
echo "  - *.yml/*.yaml files"

print_status "Version $VERSION is now consistent across the MCP Server codebase!"
print_status "All documentation has been updated with timestamp: $TIMESTAMP"
