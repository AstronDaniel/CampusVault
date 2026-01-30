#!/bin/bash

# =============================================================================
# CampusVault Manual Release & GitHub Upload Script
#
# Usage: ./manual_release.sh
# This script builds the Android APK and uploads to GitHub using the GitHub CLI (gh).
# =============================================================================

set -e

# -----------------------------------------------------------------------------
# EDIT THESE VARIABLES FOR EACH RELEASE
# -----------------------------------------------------------------------------
VERSION="1.0.11-beta.5"                          # Version string (e.g., "1.0.11", "2.0.0-beta.1") - NO 'v' prefix!
VERSION_CODE=11                                # Android version code (integer, must increment each release)
RELEASE_NOTES="
# 🚀 Release Notes: CampusVault Real-Time Chat Update

## Core Infrastructure Upgrade

- Ably Realtime Integration: Migrated from legacy WebSockets to Ably's industry-standard infrastructure. This ensures 100% reliable message delivery even in serverless environments like Vercel.
- Enhanced Security: Implemented token-based authentication via the backend, ensuring all real-time connections are secure and authorized.
- Stateless Reliability: The backend is now fully stateless for real-time traffic, improving scalability and reducing potential connection drops.

## Admin Panel Refresh

- Vibrant New Look: Redesigned the chat interface with a modern, high-contrast color palette.
- Admin Messages: Purple/Indigo gradients for clear distinction.
- User Messages: Clean surface-white with Emerald Green accents.
- Visual Participant Tracking: Added avatar placeholders and participant-specific styling to make conversations easier to follow at a glance.
- Premium Animations: Integrated smooth slide-in and zoom animations for incoming messages and interface transitions.

## Mobile Application Improvements

- Real-Time Status Indicator: Added a visual "Online/Connecting" status in the chat header so users always know their connection state.
- Robust Reconnection: Implemented aggressive auto-reconnect logic to handle spotty mobile data connections gracefully.
- Performance Fixes: Resolved critical bugs related to keyboard handling and connection lifecycle management in the mobile app.

## Unified Syncing

- Cross-Platform Consistency: Messages sent from any device now sync instantly across the Admin and Mobile platforms using a unified Ably channel architecture.
- Persistent History: Real-time speed is now paired with solid database persistence, meaning you never lose a message even if the connection is interrupted.
"   
 # Release notes for GitHub

# -----------------------------------------------------------------------------
# CONFIG
# -----------------------------------------------------------------------------
REPO="AstronDaniel/CampusVault"
APK_DIR="android/app/build/outputs/apk/release"

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
echo "   CampusVault Manual Release Script v2.0"
echo "=============================================="
echo ""

log_info "Starting release process for version v${VERSION} (code: ${VERSION_CODE})"
echo ""

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    log_error "Not inside a git repository!"
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) is not installed!"
    log_info "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    log_error "GitHub CLI is not authenticated!"
    log_info "Run: gh auth login"
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

# Update versionCode and versionName
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

read -p "Do you want to proceed with building and releasing? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    log_warning "Rolling back changes..."
    git checkout -- package.json android/app/build.gradle
    log_info "Release cancelled."
    exit 1
fi

# -----------------------------------------------------------------------------
# Commit version changes
# -----------------------------------------------------------------------------
log_info "Staging version changes..."
git add package.json android/app/build.gradle

log_info "Committing version changes..."
git commit -m "chore: bump version to v${VERSION}"

log_info "Pushing version commit..."
git push

# -----------------------------------------------------------------------------
# Build APKs
# -----------------------------------------------------------------------------
log_info "Building release APKs..."
cd android
./gradlew assembleRelease
cd ..

if [ ! -d "$APK_DIR" ]; then
    log_error "APK directory not found: $APK_DIR"
    exit 1
fi

APK_FILES=("$APK_DIR"/*.apk)
if [ ${#APK_FILES[@]} -eq 0 ]; then
    log_error "No APKs found in $APK_DIR"
    exit 1
fi

log_success "APKs built successfully:"
for apk in "${APK_FILES[@]}"; do
    echo "  - $(basename "$apk")"
done
echo ""

# -----------------------------------------------------------------------------
# Create Git tag
# -----------------------------------------------------------------------------
log_info "Creating tag v${VERSION}..."
git tag -a "v${VERSION}" -m "${RELEASE_NOTES}"

log_info "Pushing tag to remote..."
git push origin "v${VERSION}"

# -----------------------------------------------------------------------------
# Create GitHub release and upload APKs
# -----------------------------------------------------------------------------
log_info "Creating GitHub release and uploading APKs..."

gh release create "v${VERSION}" "${APK_FILES[@]}" \
  --title "CampusVault v${VERSION}" \
  --notes "${RELEASE_NOTES}" \
  --repo "$REPO"

# -----------------------------------------------------------------------------
# Done!
# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
log_success "Release v${VERSION} completed successfully!"
echo "=============================================="
echo ""
log_info "Release URL: https://github.com/${REPO}/releases/tag/v${VERSION}"
echo ""