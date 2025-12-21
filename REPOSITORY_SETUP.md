# Repository Description

## Suggested GitHub Repository Description

**Short Description (for GitHub):**
```
📚 CampusVault - A comprehensive Android app for university students to discover, share, and collaborate on educational resources. Share. Learn. Succeed.
```

## Repository Settings

### Description
```
CampusVault - Share. Learn. Succeed. | Android app for students to discover, share, and collaborate on educational resources
```

### Website (Optional)
If you have a deployed website or landing page, add it here.

### Topics/Tags
Add the following topics to make the repository more discoverable:

- `android`
- `education`
- `student`
- `learning`
- `resources`
- `university`
- `material-design`
- `mvvm`
- `kotlin`
- `java`
- `hilt`
- `retrofit`
- `room`
- `mobile-app`
- `study-materials`
- `education-app`
- `android-app`
- `campus`
- `academic`

### Features
Enable these GitHub repository features:
- [x] Issues
- [x] Projects (if using GitHub Projects for planning)
- [x] Wiki (optional, for additional documentation)
- [x] Discussions (for community Q&A)

### Social Preview Image
Upload a social preview image (1280x640px) showing:
- App logo/branding
- Key features or screenshots
- App name and tagline

The `banner.svg` in the images folder can be used as a starting point.

## How to Update Repository Description

### Via GitHub Web Interface:
1. Go to https://github.com/AstronDaniel/CampusVault
2. Click on the ⚙️ (gear icon) next to "About"
3. Add the description from above
4. Add website URL (if available)
5. Add topics/tags listed above
6. Check appropriate features
7. Click "Save changes"

### Via GitHub CLI (gh):
```bash
gh repo edit AstronDaniel/CampusVault \
  --description "CampusVault - Share. Learn. Succeed. | Android app for students to discover, share, and collaborate on educational resources" \
  --add-topic "android,education,student,learning,resources,university,material-design,mvvm,kotlin,java"
```

### Via GitHub API:
```bash
curl -X PATCH \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/AstronDaniel/CampusVault \
  -d '{"description":"CampusVault - Share. Learn. Succeed. | Android app for students to discover, share, and collaborate on educational resources"}'
```

## Additional Repository Enhancements

### Add a FUNDING.yml (Optional)
If you accept donations or sponsorships, create `.github/FUNDING.yml`:
```yaml
# Supported funding platforms
github: [AstronDaniel]
patreon: your_patreon_username
ko_fi: your_kofi_username
```

### Add Issue Templates
Create issue templates in `.github/ISSUE_TEMPLATE/` for:
- Bug reports
- Feature requests
- Questions

### Add Pull Request Template
Create `.github/PULL_REQUEST_TEMPLATE.md` with a checklist for contributors.

### Enable Security Features
- Enable Dependabot alerts
- Enable security advisories
- Add SECURITY.md with vulnerability reporting guidelines

## README Badge Suggestions

Add these badges to the top of README.md for better visibility:

```markdown
![Android](https://img.shields.io/badge/Platform-Android-green.svg)
![API](https://img.shields.io/badge/API-24%2B-brightgreen.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.1-orange.svg)
```
