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

# Function to safely update a file with sed
safe_sed_update() {
    local file="$1"
    local pattern="$2"
    local replacement="$3"
    local description="$4"
    
    if [[ -f "$file" ]]; then
        # Use BSD sed compatible patterns
        if sed -i '' "s|$pattern|$replacement|g" "$file" 2>/dev/null; then
            print_status "Updated $description in $file"
        else
            print_warning "Failed to update $description in $file"
        fi
    else
        print_warning "File $file not found, skipping $description update"
    fi
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
safe_sed_update "package.json" '"version": "[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*"' '"version": "'$VERSION'"' "version"

# Update Dockerfile
print_status "Updating Dockerfile..."
safe_sed_update "Dockerfile" 'LABEL version="[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*"' 'LABEL version="'$VERSION'"' "LABEL version"
safe_sed_update "Dockerfile" 'ARG VERSION=[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' 'ARG VERSION='$VERSION "ARG VERSION"
safe_sed_update "Dockerfile" '# Kanizsa v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' '# Kanizsa v'$VERSION "Kanizsa version comment"

# Update README.md with comprehensive version and timestamp updates
print_status "Updating README.md with comprehensive version and timestamp updates..."
safe_sed_update "README.md" 'Version: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' 'Version: '$VERSION "version"
safe_sed_update "README.md" '"version": "[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*"' '"version": "'$VERSION'"' "version in JSON"
safe_sed_update "README.md" '\*\*VERSION:\*\* [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' '**VERSION:** '$VERSION "VERSION header"
safe_sed_update "README.md" 'LAST UPDATED: .*' 'LAST UPDATED: '$TIMESTAMP "last updated timestamp"
safe_sed_update "README.md" 'Last Updated: .*' 'Last Updated: '$TIMESTAMP "last updated timestamp"
safe_sed_update "README.md" 'Updated: .*' 'Updated: '$TIMESTAMP "updated timestamp"

# Update API_DOCUMENTATION.md
print_status "Updating API_DOCUMENTATION.md..."
safe_sed_update "API_DOCUMENTATION.md" 'Version: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' 'Version: '$VERSION "version"
safe_sed_update "API_DOCUMENTATION.md" '"version": "[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*"' '"version": "'$VERSION'"' "version in JSON"
safe_sed_update "API_DOCUMENTATION.md" '\*\*VERSION:\*\* [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' '**VERSION:** '$VERSION "VERSION header"
safe_sed_update "API_DOCUMENTATION.md" 'X-Kanizsa-Version: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' 'X-Kanizsa-Version: '$VERSION "X-Kanizsa-Version header"
safe_sed_update "API_DOCUMENTATION.md" 'LAST UPDATED: .*' 'LAST UPDATED: '$TIMESTAMP "last updated timestamp"
safe_sed_update "API_DOCUMENTATION.md" 'Last Updated: .*' 'Last Updated: '$TIMESTAMP "last updated timestamp"
safe_sed_update "API_DOCUMENTATION.md" 'Updated: .*' 'Updated: '$TIMESTAMP "updated timestamp"

# Update test files
print_status "Updating test files..."
safe_sed_update "test-improvements.js" "version: '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*'" "version: '$VERSION'" "version"
safe_sed_update "test-improvements.js" '"version": "[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*"' '"version": "'$VERSION'"' "version in JSON"
safe_sed_update "test-improvements.js" '\* VERSION: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*' '\* VERSION: '$VERSION "VERSION comment"

# Update TypeScript source files with comprehensive patterns
print_status "Updating TypeScript source files with comprehensive patterns..."
if [[ -d "src" ]]; then
    find src/ -name "*.ts" -type f -exec sed -i '' "s|version: '[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*'|version: '$VERSION'|g" {} \;
    find src/ -name "*.ts" -type f -exec sed -i '' "s|\"version\": \"[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\"|\"version\": \"$VERSION\"|g" {} \;
    find src/ -name "*.ts" -type f -exec sed -i '' "s|VERSION = \"[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\"|VERSION = \"$VERSION\"|g" {} \;
    find src/ -name "*.ts" -type f -exec sed -i '' "s|\* VERSION: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|\* VERSION: $VERSION|g" {} \;
    find src/ -name "*.ts" -type f -exec sed -i '' "s|userAgent: 'Kanizsa-MCP-Client/[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*'|userAgent: 'Kanizsa-MCP-Client/$VERSION'|g" {} \;
    find src/ -name "*.ts" -type f -exec sed -i '' "s|VERSION: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|VERSION: $VERSION|g" {} \;
    find src/ -name "*.ts" -type f -exec sed -i '' "s|LAST UPDATED: .*|LAST UPDATED: $TIMESTAMP|g" {} \;
    print_status "Updated TypeScript source files"
else
    print_warning "src/ directory not found, skipping TypeScript updates"
fi

# Update any documentation files with comprehensive patterns
print_status "Updating documentation files with comprehensive patterns..."
find . -name "*.md" -type f -exec sed -i '' "s|Version: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|Version: $VERSION|g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s|\"version\": \"[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\"|\"version\": \"$VERSION\"|g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s|\*\*VERSION:\*\* [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|\*\*VERSION:\*\* $VERSION|g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s|VERSION: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|VERSION: $VERSION|g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s|LAST UPDATED: .*|LAST UPDATED: $TIMESTAMP|g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s|Last Updated: .*|Last Updated: $TIMESTAMP|g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s|Updated: .*|Updated: $TIMESTAMP|g" {} \;

# Update any remaining version patterns in all files
print_status "Updating any remaining version patterns..."
find . -name "*.ts" -type f -exec sed -i '' "s|v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|v$VERSION|g" {} \;
find . -name "*.js" -type f -exec sed -i '' "s|v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|v$VERSION|g" {} \;
find . -name "*.md" -type f -exec sed -i '' "s|v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|v$VERSION|g" {} \;

# Update any JSON files that might contain version references
print_status "Updating JSON files..."
find . -name "*.json" -type f -exec sed -i '' "s|\"version\": \"[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\"|\"version\": \"$VERSION\"|g" {} \;

# Update any YAML files that might contain version references
print_status "Updating YAML files..."
find . -name "*.yml" -type f -exec sed -i '' "s|version: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|version: $VERSION|g" {} \;
find . -name "*.yaml" -type f -exec sed -i '' "s|version: [0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*|version: $VERSION|g" {} \;

# Verify key files were updated
print_status "Verifying updates..."
VERIFICATION_FAILED=false

# Check package.json
if grep -q '"version": "'$VERSION'"' package.json 2>/dev/null; then
    print_success "✓ package.json version verified"
else
    print_error "✗ package.json version not updated correctly"
    VERIFICATION_FAILED=true
fi

# Check README.md
if grep -q "VERSION.*$VERSION" README.md 2>/dev/null; then
    print_success "✓ README.md version verified"
else
    print_error "✗ README.md version not updated correctly"
    VERIFICATION_FAILED=true
fi

# Check API_DOCUMENTATION.md
if [[ -f "API_DOCUMENTATION.md" ]] && grep -q "Version: $VERSION" API_DOCUMENTATION.md 2>/dev/null; then
    print_success "✓ API_DOCUMENTATION.md version verified"
else
    print_warning "⚠ API_DOCUMENTATION.md version verification skipped or failed"
fi

if [[ "$VERIFICATION_FAILED" == true ]]; then
    print_error "Version update verification failed! Please check the files manually."
    exit 1
fi

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
