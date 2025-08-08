#!/bin/bash

# Commit Script for Kanizsa MCP Server
# This script stages and commits changes with proper version information
# Usage: ./03_commit.sh [commit_message]
#   commit_message: The commit message to use (optional, will prompt if not provided)

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

print_status "Kanizsa MCP Server - Commit Script"
print_status "=================================="

# Check if we're in the correct repository
if [[ ! -f "$SCRIPT_DIR/VERSION" ]]; then
    print_error "VERSION file not found! Make sure you're in the kanizsa-mcp-server repository."
    exit 1
fi

# Check if we're in a git repository
if [[ ! -d "$SCRIPT_DIR/.git" ]]; then
    print_error "Not in a git repository! Make sure you're in the kanizsa-mcp-server repository."
    exit 1
fi

# Parse command line arguments
COMMIT_MESSAGE="${1:-}"

# Get version information
CURRENT_VERSION=$(cat "$SCRIPT_DIR/VERSION")
VERSION_TYPE_DESC=""

# Check if we have version type information from previous scripts
if [[ -f "$SCRIPT_DIR/.version_type" ]]; then
    VERSION_TYPE_DESC=$(cat "$SCRIPT_DIR/.version_type")
fi

print_status "Current version: $CURRENT_VERSION"
if [[ -n "$VERSION_TYPE_DESC" ]]; then
    print_status "Version type: $VERSION_TYPE_DESC"
fi

# Generate commit message if not provided
if [[ -z "$COMMIT_MESSAGE" ]]; then
    # Generate a default commit message based on version type
    case $VERSION_TYPE_DESC in
        "revision")
            COMMIT_MESSAGE="fix: version bump (revision)"
            ;;
        "minor")
            COMMIT_MESSAGE="feat: version bump (minor)"
            ;;
        "major")
            COMMIT_MESSAGE="BREAKING: version bump (major)"
            ;;
        "custom")
            COMMIT_MESSAGE="feat: version bump (custom)"
            ;;
        *)
            COMMIT_MESSAGE="chore: version bump"
            ;;
    esac
    print_status "Using auto-generated commit message: $COMMIT_MESSAGE"
fi

if [[ -z "$COMMIT_MESSAGE" ]]; then
    print_error "Commit message cannot be empty."
    exit 1
fi

# Add version info to commit message if version was changed
if [[ -n "$VERSION_TYPE_DESC" ]]; then
    COMMIT_MESSAGE="$COMMIT_MESSAGE - v$CURRENT_VERSION ($VERSION_TYPE_DESC)"
fi

print_status "Final commit message: $COMMIT_MESSAGE"

# Check if there are changes to commit
print_status "Checking for changes to commit..."
if [[ -z "$(git status --porcelain)" ]]; then
    print_warning "No changes to commit."
    print_status "Current git status:"
    git status
    exit 0
fi

# Show what will be committed
print_status "Changes to be committed:"
git status --porcelain

# Add all changes
print_status "Adding all changes..."
git add .

# Verify what's staged
print_status "Staged changes:"
git diff --cached --name-only

# Commit changes
print_status "Committing changes..."
if git commit -m "$COMMIT_MESSAGE"; then
    print_success "✓ Changes committed successfully!"
else
    print_error "✗ Commit failed!"
    exit 1
fi

# Show commit information
print_status "Commit information:"
git log --oneline -1

# Store commit information for the next script
git rev-parse HEAD > "$SCRIPT_DIR/.last_commit_hash"
echo "$COMMIT_MESSAGE" > "$SCRIPT_DIR/.last_commit_message"

print_success "Commit script completed successfully!"
print_status "Repository: kanizsa-mcp-server"
print_status "Version: $CURRENT_VERSION"
print_status "Commit message: $COMMIT_MESSAGE"
