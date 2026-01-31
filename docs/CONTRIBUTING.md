# Contributing to Campus Vault docs

Thank you for contributing! This guide explains how to preview changes locally and run the simple linters included in this repository.

## Quick start (local preview)
1. Open `docs/site/index.html` in your browser to preview changes instantly.
2. Edit files in `docs/site/` and open a pull request against the `docs` branch.

## Linting
We include basic HTML and CSS linting to keep docs consistent.

1. Install dependencies (from `docs/site`):

   npm install

2. Run the checks:

   npm run lint

If you see failures, the commands will print actionable messages to fix.

## Accessibility & Quality
- Keep content semantic (use headings, lists, descriptive link text).
- Include alt text for images and use the `skip to content` link for keyboard users.

## PR checklist
- [ ] Clear description of changes
- [ ] Previewed locally
- [ ] Linting & basic checks pass

Thanks — we appreciate your help! ✨