#!/bin/bash

# Master Push Script for Kanizsa MCP Server
# This script orchestrates the complete workflow: version → documentation → commit → push
# Usage: ./push.sh [version_type] [commit_message]
#   version_type: "revision", "minor", "major", "custom", or "none" (default: "none")
#   commit_message: The commit message to use (optional, will prompt if not provided)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header "Kanizsa MCP Server - Master Push Workflow"
print_status "Orchestrating complete workflow: version → documentation → commit → push"

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
VERSION_TYPE="${1:-}"

# Show usage if version type is missing
if [[ -z "$VERSION_TYPE" ]]; then
    echo ""
    print_status "Usage: $0 [version_type]"
    echo "  version_type: 'revision', 'minor', 'major', or 'custom'"
    echo ""
    print_status "Examples:"
    echo "  $0 revision                    # Patch version bump"
    echo "  $0 minor                       # Minor version bump"
    echo "  $0 major                       # Major version bump"
    echo "  $0 custom                      # Custom version (will prompt for version)"
    echo ""
    print_error "Version type is required!"
    echo ""
    exit 1
fi

# Validate version type
case $VERSION_TYPE in
    "revision"|"minor"|"major"|"custom")
        # Valid version type
        ;;
    *)
        print_error "Invalid version type: $VERSION_TYPE"
        print_error "Valid types: revision, minor, major, custom"
        exit 1
        ;;
esac

# Get current version
CURRENT_VERSION=$(cat "$SCRIPT_DIR/VERSION")
print_status "Current version: $CURRENT_VERSION"
print_status "Version type: $VERSION_TYPE"

# Step 1: Version Update
print_step "Step 1: Updating version..."
print_status "Running: ./01_update_version.sh $VERSION_TYPE"

if [[ -f "$SCRIPT_DIR/01_update_version.sh" ]]; then
    if ./01_update_version.sh "$VERSION_TYPE"; then
        print_success "✓ Version update completed"
    else
        print_error "✗ Version update failed!"
        exit 1
    fi
else
    print_error "✗ 01_update_version.sh not found!"
    exit 1
fi

# Step 2: Documentation Update
print_step "Step 2: Updating documentation..."
print_status "Running: ./02_update_documentation.sh"

if [[ -f "$SCRIPT_DIR/02_update_documentation.sh" ]]; then
    if ./02_update_documentation.sh; then
        print_success "✓ Documentation update completed"
    else
        print_error "✗ Documentation update failed!"
        exit 1
    fi
else
    print_error "✗ 02_update_documentation.sh not found!"
    exit 1
fi

# Step 3: Commit
print_step "Step 3: Committing changes..."
print_status "Running: ./03_commit.sh"

if [[ -f "$SCRIPT_DIR/03_commit.sh" ]]; then
    if ./03_commit.sh; then
        print_success "✓ Commit completed"
    else
        print_error "✗ Commit failed!"
        exit 1
    fi
else
    print_error "✗ 03_commit.sh not found!"
    exit 1
fi

# Step 4: Push
print_step "Step 4: Pushing to remote..."
print_status "Running: ./04_push.sh"

if [[ -f "$SCRIPT_DIR/04_push.sh" ]]; then
    if ./04_push.sh; then
        print_success "✓ Push completed"
    else
        print_error "✗ Push failed!"
        exit 1
    fi
else
    print_error "✗ 04_push.sh not found!"
    exit 1
fi

# Success summary
print_header "🎉 Workflow Completed Successfully!"

# Get final version
FINAL_VERSION=$(cat "$SCRIPT_DIR/VERSION")
print_success "Version updated: $CURRENT_VERSION → $FINAL_VERSION"

print_status "Repository: kanizsa-mcp-server"
print_status "All changes have been committed and pushed to remote"
print_status "Workflow steps completed:"
echo "  ✓ Version update (if requested)"
echo "  ✓ Documentation update"
echo "  ✓ Commit"
echo "  ✓ Push"

print_success "Master push workflow completed successfully!"
exit 0
