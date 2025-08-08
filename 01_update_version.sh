#!/bin/bash

# Version Update Script for Kanizsa MCP Server
# This script updates version numbers across the codebase
# Usage: ./01_update_version.sh [version_type] [current_version]
#   version_type: "revision", "minor", "major", or "custom"
#   current_version: current version (optional, will be read from VERSION file if not provided)

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

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_status "Kanizsa MCP Server - Version Update Script"
print_status "=========================================="

# Check if we're in the correct repository
if [[ ! -f "$SCRIPT_DIR/VERSION" ]]; then
    print_error "VERSION file not found! Make sure you're in the kanizsa-mcp-server repository."
    exit 1
fi

# Parse command line arguments
VERSION_TYPE="${1:-}"
CURRENT_VERSION="${2:-}"

# If no arguments provided, show usage
if [[ -z "$VERSION_TYPE" ]]; then
    echo ""
    print_status "Usage: $0 [version_type] [current_version]"
    echo "  version_type: 'revision', 'minor', 'major', 'custom', or 'none'"
    echo "  current_version: current version (optional, will be read from VERSION file)"
    echo ""
    print_status "Examples:"
    echo "  $0 revision                    # Bump patch version (1.0.0 → 1.0.1)"
    echo "  $0 minor                       # Bump minor version (1.0.0 → 1.1.0)"
    echo "  $0 major                       # Bump major version (1.0.0 → 2.0.0)"
    echo "  $0 custom 2.0.0                # Set to specific version"
    echo "  $0 none                        # No version change"
    echo ""
    exit 1
fi

# Read current version if not provided
if [[ -z "$CURRENT_VERSION" ]]; then
    CURRENT_VERSION=$(cat "$SCRIPT_DIR/VERSION")
fi

print_status "Current version: $CURRENT_VERSION"
print_status "Version type: $VERSION_TYPE"

# Calculate new version based on type
case $VERSION_TYPE in
    "revision"|"patch")
        # Parse current version
        IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
        MAJOR="${VERSION_PARTS[0]}"
        MINOR="${VERSION_PARTS[1]}"
        PATCH="${VERSION_PARTS[2]}"
        NEW_PATCH=$((PATCH + 1))
        NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
        VERSION_TYPE_DESC="revision"
        ;;
    "minor")
        # Parse current version
        IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
        MAJOR="${VERSION_PARTS[0]}"
        MINOR="${VERSION_PARTS[1]}"
        NEW_MINOR=$((MINOR + 1))
        NEW_VERSION="$MAJOR.$NEW_MINOR.0"
        VERSION_TYPE_DESC="minor"
        ;;
    "major")
        # Parse current version
        IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
        MAJOR="${VERSION_PARTS[0]}"
        NEW_MAJOR=$((MAJOR + 1))
        NEW_VERSION="$NEW_MAJOR.0.0"
        VERSION_TYPE_DESC="major"
        ;;
    "custom")
        if [[ -z "$CURRENT_VERSION" ]]; then
            print_error "Custom version requires current_version parameter"
            exit 1
        fi
        NEW_VERSION="$CURRENT_VERSION"
        VERSION_TYPE_DESC="custom"
        ;;
    "none")
        NEW_VERSION="$CURRENT_VERSION"
        VERSION_TYPE_DESC="none"
        print_status "No version change requested, keeping current version: $CURRENT_VERSION"
        ;;
    *)
        print_error "Invalid version type: $VERSION_TYPE"
        print_error "Valid types: revision, minor, major, custom, none"
        exit 1
        ;;
esac

print_status "Updating version from $CURRENT_VERSION to $NEW_VERSION"

# Update VERSION file
echo "$NEW_VERSION" > "$SCRIPT_DIR/VERSION"

# Update package.json version
if [[ -f "$SCRIPT_DIR/package.json" ]]; then
    sed -i '' "s|\"version\": \"[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\"|\"version\": \"$NEW_VERSION\"|g" "$SCRIPT_DIR/package.json"
    print_status "Updated package.json version"
else
    print_warning "package.json not found"
fi

# Verify the update
if [[ -f "$SCRIPT_DIR/VERSION" ]]; then
    VERIFIED_VERSION=$(cat "$SCRIPT_DIR/VERSION")
    if [[ "$VERIFIED_VERSION" == "$NEW_VERSION" ]]; then
        print_success "✓ VERSION file updated to $NEW_VERSION"
    else
        print_error "✗ VERSION file verification failed: expected $NEW_VERSION, got $VERIFIED_VERSION"
        exit 1
    fi
else
    print_error "✗ VERSION file not found after update"
    exit 1
fi

if [[ -f "$SCRIPT_DIR/package.json" ]]; then
    if grep -q '"version": "'$NEW_VERSION'"' "$SCRIPT_DIR/package.json"; then
        print_success "✓ package.json version updated to $NEW_VERSION"
    else
        print_error "✗ package.json version verification failed"
        exit 1
    fi
fi

print_success "Version update completed successfully!"
print_status "New version: $NEW_VERSION ($VERSION_TYPE_DESC)"
print_status "Files updated:"
echo "  - VERSION"
echo "  - package.json"

# Create a temporary file to pass the new version to the next script
echo "$NEW_VERSION" > "$SCRIPT_DIR/.new_version"
echo "$VERSION_TYPE_DESC" > "$SCRIPT_DIR/.version_type"

print_success "Version update script completed!"
