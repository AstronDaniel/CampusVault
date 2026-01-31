Campus Vault docs site

- This folder (`docs/site/`) contains a lightweight static site (HTML/CSS/jQuery) used for GitHub Pages deployment.
- Edit `index.html` and `privacy.html` for main content.
- The GitHub Actions workflow on `master` deploys the `site/` directory from the `docs` branch to GitHub Pages.

Preview locally: open `docs/site/index.html` in a browser.

Local linting:

1. cd into `docs/site/`
2. Run `npm install`
3. Run `npm run lint` to validate HTML and CSS before opening a PR.

See `.github/workflows/validate-docs.yml` for the CI checks that run on PRs to `docs`.