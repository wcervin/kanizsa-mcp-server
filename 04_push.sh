#!/bin/bash

# Push Script for Kanizsa MCP Server
# This script pushes committed changes to the remote repository
# Usage: ./04_push.sh [remote_name] [branch_name]
#   remote_name: Remote name to push to (default: origin)
#   branch_name: Branch name to push (default: current branch)

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

print_status "Kanizsa MCP Server - Push Script"
print_status "================================="

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
REMOTE_NAME="${1:-origin}"
BRANCH_NAME="${2:-}"

# Get current branch if not specified
if [[ -z "$BRANCH_NAME" ]]; then
    BRANCH_NAME=$(git branch --show-current)
fi

# Get version information
CURRENT_VERSION=$(cat "$SCRIPT_DIR/VERSION")

print_status "Current version: $CURRENT_VERSION"
print_status "Remote: $REMOTE_NAME"
print_status "Branch: $BRANCH_NAME"

# Check if remote exists
print_status "Checking remote configuration..."
if ! git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
    print_error "Remote '$REMOTE_NAME' not found!"
    print_status "Available remotes:"
    git remote -v
    exit 1
fi

REMOTE_URL=$(git remote get-url "$REMOTE_NAME")
print_status "Remote URL: $REMOTE_URL"

# Check if there are commits to push
print_status "Checking for commits to push..."
LOCAL_COMMITS=$(git log "$REMOTE_NAME/$BRANCH_NAME"..HEAD --oneline 2>/dev/null || git log --oneline -1)

if [[ -z "$LOCAL_COMMITS" ]]; then
    print_warning "No new commits to push."
    print_status "Current status:"
    git status
    exit 0
fi

print_status "Commits to push:"
echo "$LOCAL_COMMITS"

# Check if we have commit information from previous script
if [[ -f "$SCRIPT_DIR/.last_commit_hash" ]]; then
    LAST_COMMIT_HASH=$(cat "$SCRIPT_DIR/.last_commit_hash")
    print_status "Last commit hash: $LAST_COMMIT_HASH"
fi

if [[ -f "$SCRIPT_DIR/.last_commit_message" ]]; then
    LAST_COMMIT_MESSAGE=$(cat "$SCRIPT_DIR/.last_commit_message")
    print_status "Last commit message: $LAST_COMMIT_MESSAGE"
fi

# Show what will be pushed
print_status "Changes to be pushed:"
git diff "$REMOTE_NAME/$BRANCH_NAME"..HEAD --name-only

# Push changes
print_status "Pushing to $REMOTE_NAME/$BRANCH_NAME..."
if git push "$REMOTE_NAME" "$BRANCH_NAME"; then
    print_success "✓ Changes pushed successfully!"
else
    print_error "✗ Push failed!"
    exit 1
fi

# Verify push
print_status "Verifying push..."
if git fetch "$REMOTE_NAME" "$BRANCH_NAME" 2>/dev/null; then
    LOCAL_HEAD=$(git rev-parse HEAD)
    REMOTE_HEAD=$(git rev-parse "$REMOTE_NAME/$BRANCH_NAME")
    
    if [[ "$LOCAL_HEAD" == "$REMOTE_HEAD" ]]; then
        print_success "✓ Push verification successful!"
    else
        print_error "✗ Push verification failed! Local and remote heads don't match."
        exit 1
    fi
else
    print_warning "⚠ Could not verify push (fetch failed)"
fi

# Show final status
print_status "Final repository status:"
git status

# Clean up temporary files
print_status "Cleaning up temporary files..."
rm -f "$SCRIPT_DIR/.new_version" "$SCRIPT_DIR/.version_type" "$SCRIPT_DIR/.last_commit_hash" "$SCRIPT_DIR/.last_commit_message"

print_success "Push script completed successfully!"
print_status "Repository: kanizsa-mcp-server"
print_status "Version: $CURRENT_VERSION"
print_status "Remote: $REMOTE_NAME"
print_status "Branch: $BRANCH_NAME"
print_status "Remote URL: $REMOTE_URL"
