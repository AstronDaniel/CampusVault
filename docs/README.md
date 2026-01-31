# Campus Vault docs site 📚

This folder (`docs/site/`) contains a lightweight static site (HTML/CSS/jQuery) used for GitHub Pages deployment.

## Local preview & linting ✅

- Preview locally: open `docs/site/index.html` in a browser.
- Local linting:
  1. cd into `docs/site/`
  2. Run `npm install`
  3. Run `npm run lint` to validate HTML and CSS before opening a PR.

The CI checks that run on PRs to `docs` are defined in `.github/workflows/validate-docs.yml` (HTML + CSS linting).

---

## Deployment (how this repo publishes the site) 🚀

We support two deploy workflows (fallbacks are in place because of an external deprecation):

1. **Primary (recommended):** `Deploy docs site to gh-pages` — this workflow (built with `peaceiris/actions-gh-pages@v3`) publishes `docs/site/` from the `docs` branch to the `gh-pages` branch.
   - Triggers: `push` to `master` and `workflow_dispatch` (manual run available in the Actions UI).
   - If your repository or org restricts `GITHUB_TOKEN` from pushing to branches, provide a Personal Access Token (classic) as `GH_PAGES_PAT` (see below).

2. **Legacy (disabled auto-upload):** We previously used `configure-pages` + `upload-pages-artifact` but the automatic upload step was disabled because it pulled a deprecated dependency. The disabled workflow retains a `workflow_dispatch` entry but does not perform the upload.

---

## If deploy fails with a 403 (permission denied) ⚠️

If the deploy job fails to push to `gh-pages` with a `Permission denied to github-actions[bot]` or similar:

1. Create a Personal Access Token (classic) with `repo` scope. (GitHub → Settings → Developer settings → Personal access tokens → Generate new token.)
2. Add the token as a repository secret named `GH_PAGES_PAT` (Repository → Settings → Secrets → Actions → New repository secret).
3. Re-run the **Deploy docs site to gh-pages** workflow (Actions → select workflow → Run workflow).

When `GH_PAGES_PAT` is set the deploy action will use it; otherwise it falls back to `GITHUB_TOKEN`.

---

## Quick checklist for PRs to `docs` ✅

- [ ] Preview locally and confirm visual changes
- [ ] Run `npm run lint` in `docs/site/` and fix issues
- [ ] Target branch: `docs`
- [ ] Include a short description of what changed

Thanks for helping keep the docs clean and accessible — contributions welcome! ✨