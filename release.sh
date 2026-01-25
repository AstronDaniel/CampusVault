#!/bin/bash

# =============================================================================
# CampusVault Release Script
# 
# ./release.sh
# This script automates the release process:
# 1. Updates version in package.json
# 2. Updates versionName and versionCode in android/app/build.gradle
# 3. Commits the version changes
# 4. Creates a git tag
# 5. Pushes commits and tags to trigger the GitHub Actions workflow
# =============================================================================

# -----------------------------------------------------------------------------
# EDIT THESE VARIABLES FOR EACH RELEASE
#  eg. 1.0.3 → the main version (DO NOT include 'v' prefix here!)
#
# rc → release candidate
# beta → still rough
# .22 → the 22nd release-candidate build
# -----------------------------------------------------------------------------
VERSION="1.0.3-beta.22"                           # Version string (e.g., "1.0.3", "2.0.0-beta.1") - NO 'v' prefix!
VERSION_CODE=5                            # Android version code (integer, must increment each release)
RELEASE_MESSAGE="Improve app icon. Bug fixes and improvements"  # Tag message for the release

# -----------------------------------------------------------------------------
# Colors for output
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Helper functions
# -----------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# -----------------------------------------------------------------------------
# Pre-flight checks
# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "   CampusVault Release Script v1.0"
echo "=============================================="
echo ""

log_info "Starting release process for version v${VERSION} (code: ${VERSION_CODE})"
echo ""

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    log_error "Not inside a git repository!"
    exit 1
fi

# Check for uncommitted changes (excluding the files we're about to modify)
if ! git diff --quiet HEAD -- ':!package.json' ':!android/app/build.gradle'; then
    log_warning "You have uncommitted changes. Please commit or stash them first."
    git status --short
    read -p "Do you want to continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Release cancelled."
        exit 1
    fi
fi

# Check if tag already exists
if git rev-parse "v${VERSION}" > /dev/null 2>&1; then
    log_error "Tag v${VERSION} already exists! Please use a different version."
    exit 1
fi

# -----------------------------------------------------------------------------
# Update package.json
# -----------------------------------------------------------------------------
log_info "Updating package.json version to ${VERSION}..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" package.json
else
    # Linux/Git Bash on Windows
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" package.json
fi

if grep -q "\"version\": \"${VERSION}\"" package.json; then
    log_success "package.json updated successfully"
else
    log_error "Failed to update package.json"
    exit 1
fi

# -----------------------------------------------------------------------------
# Update android/app/build.gradle
# -----------------------------------------------------------------------------
log_info "Updating android/app/build.gradle..."

GRADLE_FILE="android/app/build.gradle"

# Update versionCode
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/versionCode [0-9]*/versionCode ${VERSION_CODE}/" "$GRADLE_FILE"
    sed -i '' "s/versionName \"[^\"]*\"/versionName \"${VERSION}\"/" "$GRADLE_FILE"
else
    sed -i "s/versionCode [0-9]*/versionCode ${VERSION_CODE}/" "$GRADLE_FILE"
    sed -i "s/versionName \"[^\"]*\"/versionName \"${VERSION}\"/" "$GRADLE_FILE"
fi

if grep -q "versionCode ${VERSION_CODE}" "$GRADLE_FILE" && grep -q "versionName \"${VERSION}\"" "$GRADLE_FILE"; then
    log_success "build.gradle updated successfully"
else
    log_error "Failed to update build.gradle"
    exit 1
fi

# -----------------------------------------------------------------------------
# Show changes for confirmation
# -----------------------------------------------------------------------------
echo ""
log_info "Changes made:"
echo "----------------------------------------"
git --no-pager diff --color package.json android/app/build.gradle
echo "----------------------------------------"
echo ""

read -p "Do you want to commit and push these changes? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    log_warning "Rolling back changes..."
    git checkout -- package.json android/app/build.gradle
    log_info "Release cancelled."
    exit 1
fi

# -----------------------------------------------------------------------------
# Git operations
# -----------------------------------------------------------------------------
log_info "Staging changes..."
git add package.json android/app/build.gradle

log_info "Committing changes..."
git commit -m "chore: bump version to v${VERSION}"

log_info "Pushing commits..."
git push

log_info "Creating tag v${VERSION}..."
git tag -a "v${VERSION}" -m "${RELEASE_MESSAGE}"

log_info "Pushing tag..."
git push origin "v${VERSION}"

# -----------------------------------------------------------------------------
# Done!
# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
log_success "Release v${VERSION} completed successfully!"
echo "=============================================="
echo ""
log_info "The GitHub Actions workflow should now be triggered."
log_info "Check your repository's Actions tab for the build status."
echo ""
