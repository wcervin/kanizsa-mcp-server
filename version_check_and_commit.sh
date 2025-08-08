#!/bin/bash

# Commit and Push Script for Kanizsa MCP Server
# This script asks if you want a version bump, then either commits directly or runs the version script
# Usage: ./version_check_and_commit.sh [version_bump] [commit_message]
#   version_bump: "y" for yes, "n" for no, "1" for revision, "2" for minor, "3" for major
#   commit_message: The commit message to use

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

# Parse command line arguments
VERSION_BUMP_CHOICE="${1:-}"
COMMIT_MESSAGE="${2:-}"

# If no arguments provided, show usage
if [[ -z "$VERSION_BUMP_CHOICE" ]]; then
    echo ""
    print_status "Usage: $0 [version_bump] [commit_message]"
    echo "  version_bump: 'y' for yes, 'n' for no, '1' for revision, '2' for minor, '3' for major"
    echo "  commit_message: The commit message to use"
    echo ""
    print_status "Examples:"
    echo "  $0 n 'fix: bug fix'                    # No version bump"
    echo "  $0 y 'feat: new feature'               # Version bump with interactive prompts"
    echo "  $0 2 'feat: new feature'               # Minor version bump"
    echo "  $0 3 'BREAKING: major changes'         # Major version bump"
    echo ""
    exit 1
fi

# Handle version bump choice
if [[ "$VERSION_BUMP_CHOICE" =~ ^[Yy]$ ]] || [[ "$VERSION_BUMP_CHOICE" =~ ^[123]$ ]]; then
    print_status "Version bump requested. Processing version update..."
    
    # Determine version type from input
    if [[ "$VERSION_BUMP_CHOICE" =~ ^[Yy]$ ]]; then
        # Interactive mode - ask for version type
        echo ""
        print_status "What type of version update is this?"
        echo "1) Revision (patch) - Bug fixes, minor improvements"
        echo "2) Minor version - New features, backward compatible"
        echo "3) Major version - Breaking changes"
        echo ""
        read -p "Enter your choice (1-3): " VERSION_CHOICE
    else
        # Direct version type from argument
        VERSION_CHOICE="$VERSION_BUMP_CHOICE"
    fi

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
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac

    # Update version
    print_status "Updating version from $CURRENT_VERSION to $NEW_VERSION"
    echo "$NEW_VERSION" > "$SCRIPT_DIR/VERSION"
    
    # Run version update script (includes documentation updates)
    print_status "Running version script with documentation updates..."
    cd "$SCRIPT_DIR"
    ./update_version.sh
    
    print_success "Version updated to $NEW_VERSION with documentation updates"
else
    print_status "No version bump requested. Proceeding with direct commit."
    NEW_VERSION="$CURRENT_VERSION"
    VERSION_TYPE="none"
fi

# Get commit message if not provided
if [[ -z "$COMMIT_MESSAGE" ]]; then
    echo ""
    print_status "Enter commit message:"
    read -p "Commit message: " COMMIT_MESSAGE
fi

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

if [[ "$VERSION_TYPE" != "none" ]]; then
    print_status "Version bump completed with documentation updates!"
    print_status "All documentation files have been updated with new version and timestamp."
fi

print_success "MCP Server commit and push complete!"
