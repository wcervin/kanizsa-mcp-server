#!/bin/bash

# Commit and Push Script for Kanizsa MCP Server
# This script handles version bumping, committing, and pushing for the MCP Server

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

print_status "Kanizsa MCP Server - Commit and Push Script"
print_status "==========================================="

# Check if we're in the correct repository
if [[ ! -f "$SCRIPT_DIR/VERSION" ]]; then
    print_error "VERSION file not found! Make sure you're in the kanizsa-mcp-server repository."
    exit 1
fi

# Read current version
CURRENT_VERSION=$(cat "$SCRIPT_DIR/VERSION")
print_status "Current version: $CURRENT_VERSION"

# Ask user for version update type
echo ""
print_status "What type of version update is this?"
echo "1) Revision (patch) - Bug fixes, minor improvements"
echo "2) Minor version - New features, backward compatible"
echo "3) Major version - Breaking changes"
echo "4) No version change - Just commit and push"
echo ""
read -p "Enter your choice (1-4): " VERSION_CHOICE

# Handle version update
case $VERSION_CHOICE in
    1)
        print_status "Bumping revision (patch) version..."
        # Parse current version
        IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
        MAJOR="${VERSION_PARTS[0]}"
        MINOR="${VERSION_PARTS[1]}"
        PATCH="${VERSION_PARTS[2]}"
        NEW_PATCH=$((PATCH + 1))
        NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
        VERSION_TYPE="revision"
        ;;
    2)
        print_status "Bumping minor version..."
        # Parse current version
        IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
        MAJOR="${VERSION_PARTS[0]}"
        MINOR="${VERSION_PARTS[1]}"
        NEW_MINOR=$((MINOR + 1))
        NEW_VERSION="$MAJOR.$NEW_MINOR.0"
        VERSION_TYPE="minor"
        ;;
    3)
        print_status "Bumping major version..."
        # Parse current version
        IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
        MAJOR="${VERSION_PARTS[0]}"
        NEW_MAJOR=$((MAJOR + 1))
        NEW_VERSION="$NEW_MAJOR.0.0"
        VERSION_TYPE="major"
        ;;
    4)
        print_status "No version change requested."
        NEW_VERSION="$CURRENT_VERSION"
        VERSION_TYPE="none"
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Update version if needed
if [[ "$VERSION_TYPE" != "none" ]]; then
    print_status "Updating version from $CURRENT_VERSION to $NEW_VERSION"
    echo "$NEW_VERSION" > "$SCRIPT_DIR/VERSION"
    
    # Run version update script
    print_status "Running version update script..."
    cd "$SCRIPT_DIR"
    ./update_version.sh
    
    print_success "Version updated to $NEW_VERSION"
else
    NEW_VERSION="$CURRENT_VERSION"
fi

# Get commit message
echo ""
print_status "Enter commit message:"
read -p "Commit message: " COMMIT_MESSAGE

if [[ -z "$COMMIT_MESSAGE" ]]; then
    print_error "Commit message cannot be empty."
    exit 1
fi

# Add version info to commit message if version was changed
if [[ "$VERSION_TYPE" != "none" ]]; then
    COMMIT_MESSAGE="$COMMIT_MESSAGE - v$NEW_VERSION ($VERSION_TYPE)"
fi

# Git operations
print_status "Performing Git operations..."

# Check if there are changes to commit
if [[ -z "$(git status --porcelain)" ]]; then
    print_warning "No changes to commit."
    exit 0
fi

# Add all changes
print_status "Adding all changes..."
git add .

# Commit changes
print_status "Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Push to remote
print_status "Pushing to remote..."
git push origin main

print_success "Successfully committed and pushed changes!"
print_status "Repository: kanizsa-mcp-server"
print_status "Version: $NEW_VERSION"
print_status "Commit message: $COMMIT_MESSAGE"

print_status "Next steps:"
echo "  1. Update main platform to match this version"
echo "  2. Run sync_all_versions.sh in main platform"
echo "  3. Commit and push changes in Adjective Agent"
echo "  4. Test all components together"
echo "  5. Tag release if ready: git tag v$NEW_VERSION && git push origin v$NEW_VERSION"

print_success "MCP Server commit and push complete!"
