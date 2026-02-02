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
VERSION="1.1.1"                                    # Version string
VERSION_CODE=14                                # Android version code
RELEASE_NOTES=$(cat <<'EOF'
# CampusVault v1.1.0 Release Notes

## 🎉 What's New - Major User Management Update

### 🔥 Comprehensive User Management System
A complete overhaul of admin user management capabilities with a modern, feature-rich interface.

#### 👥 Advanced User Management Features
- **Enhanced User Interface**: Beautiful, modern design with gradient headers and background images
- **Advanced Search & Filtering**: 
  - Real-time search by username or email
  - Filter by role (Admin/Student)
  - Filter by status (Active/Banned)
  - Expandable filter sections with chip-based selection
- **Bulk Operations**:
  - Multi-select users with checkboxes
  - Select all functionality
  - Bulk ban multiple users
  - Bulk delete multiple users
  - Confirmation dialogs for safety

#### ✨ User CRUD Operations
- **Add New Users**: 
  - Modal form with validation
  - Set username, email, password, and role
  - Professional form design
- **Edit Existing Users**:
  - Update username, email, and role
  - View account status (verified/banned)
  - Real-time status indicators
- **Role Management**:
  - Quick role switching (Admin ↔ Student)
  - Visual role indicators with color coding
  - Gradient avatars with role-specific icons

#### 🎨 Modern UI/UX Enhancements
- **Statistics Dashboard**: Real-time stats showing Total, Active, Admin, and Banned users
- **Professional User Cards**: 
  - Status indicators (Verified, Banned, Active)
  - Color-coded role chips
  - Gradient icon avatars
  - Selection mode support
- **Smooth Animations**: Staggered entrance animations using Reanimated
- **Dark Mode Support**: Full dark/light theme compatibility
- **Loading States**: Professional loading indicators and empty states

### 🔧 Backend API Enhancements
Expanded admin API with new user management endpoints:

#### 🆕 New API Endpoints
- `POST /api/v1/admin/users` - Create new users
- `PATCH /api/v1/admin/users/{id}` - Update user information
- `PATCH /api/v1/admin/users/{id}/role` - Update user roles
- `POST /api/v1/admin/users/{id}/ban` - Ban users
- `POST /api/v1/admin/users/{id}/unban` - Unban users
- `DELETE /api/v1/admin/users/{id}` - Delete users

### 🚀 Navigation & Access Improvements
- **Seamless Navigation**: Direct access from Admin Dashboard to User Management
- **Proper Routing**: Full navigation stack integration
- **Back Navigation**: Consistent return paths

### 🛠️ Technical Improvements

#### 📱 Mobile-First Design
- **Responsive Layouts**: Optimized for mobile devices
- **Touch-Friendly**: Large touch targets and smooth interactions
- **Floating Action Button**: Quick access to add new users
- **Pull-to-Refresh**: Easy data refreshing

#### 🔒 Security & Validation
- **Form Validation**: Client-side validation for all user inputs
- **Confirmation Dialogs**: Safety prompts for destructive actions
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Toast Notifications**: Real-time feedback for all operations

#### ⚡ Performance Optimizations
- **Efficient Data Loading**: Promise-based parallel requests
- **Smart State Management**: Optimized re-renders and state updates
- **Memory Management**: Proper cleanup and resource management

## 🎯 User Experience Improvements
- **Intuitive Interface**: Clear visual hierarchy and information architecture
- **Contextual Actions**: Relevant actions available at the right time
- **Consistent Design**: Unified design language across admin screens
- **Accessibility**: Screen reader friendly and high contrast support

## 🐛 Bug Fixes
- Fixed navigation routing for admin screens
- Resolved TypeScript compilation errors
- Fixed authentication flow for admin operations
- Corrected modal overlay and keyboard handling

## 🔄 Breaking Changes
None - this release is fully backward compatible with existing admin accounts.

## 📊 Admin Dashboard Enhancements
- **Improved Quick Actions**: Direct navigation to User Management
- **Better Visual Design**: Enhanced card layouts and iconography
- **Real-time Data**: Live statistics and metrics

## 🚀 What's Coming Next
- Advanced analytics and reporting
- Resource moderation interface  
- Automated user verification system
- Activity audit logs
- Bulk notification system

## 💡 For Administrators
- Access User Management from the Admin Dashboard
- All user operations require admin authentication
- Use bulk operations for efficient user management
- Pull down to refresh user data anytime

## 🙏 Acknowledgments
Thanks to the development team for extensive testing and feedback on the new user management system.

---

**Full Changelog**: [View on GitHub](https://github.com/AstronDaniel/CampusVault/compare/v1.0.15-beta.2...v1.1.0)
**Report Issues**: [GitHub Issues](https://github.com/AstronDaniel/CampusVault/issues)
**Admin Documentation**: [User Management Guide](#)
EOF
)
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