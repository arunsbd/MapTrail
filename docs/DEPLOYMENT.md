# MapTrail development and deployment

## Local development

Requires Node.js 22 or newer and pnpm 11. This Codex session used its bundled Node.js runtime; install Node.js and pnpm separately if you want to run the commands from an ordinary terminal.

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000`.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
pnpm check:export
```

See [PLAN.md](../PLAN.md) for the product roadmap. The current implementation intentionally stays within the first Border Hunt milestone.

## Publish with GitHub Pages

The public game address after a successful deployment is [arunsbd.github.io/MapTrail](https://arunsbd.github.io/MapTrail/).

One-time setup in the GitHub repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**. There is no need to generate another workflow.
3. Push to `main`, or open **Actions → Deploy MapTrail to GitHub Pages → Run workflow** and choose `main`.
4. Wait for both the build and deployment jobs to succeed, then open the game address.

The workflow installs the pinned pnpm version, runs tests and lint, builds the site, checks its asset paths, and publishes only after those checks pass. Each later push to `main` updates the same link. No personal access token or repository secret is needed for this workflow.

If the workflow reports that it cannot find the Pages site, check the Source setting above and rerun it. Do not select **Deploy from a branch**: the source files need to be built first.

### How static hosting works

`pnpm build` writes the deployable HTML, CSS, and JavaScript into `out/`, which is ignored by Git. GitHub Pages serves these files without a Node.js server. The game starts in the browser so every visit gets a fresh random round, rather than sharing an answer chosen during the build. Players must have JavaScript enabled.

The workflow reads the site's base path and full URL from GitHub Pages and supplies them through `BASE_PATH` and `NEXT_PUBLIC_SITE_URL`. For this repository the base path is `/MapTrail`; local development defaults to `/`. If you later configure a custom domain, rebuilding uses the updated Pages path and canonical URL.

To check the GitHub Pages build locally in PowerShell:

```powershell
$env:BASE_PATH = "/MapTrail"
$env:NEXT_PUBLIC_SITE_URL = "https://arunsbd.github.io/MapTrail"
pnpm build
pnpm check:export
Remove-Item Env:BASE_PATH
Remove-Item Env:NEXT_PUBLIC_SITE_URL
```

Use `pnpm dev` for local development. `next start` is not used for a static export; a static web server must serve the contents of `out/` at the same path used when building.

References: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Next.js static export](https://nextjs.org/docs/app/guides/static-exports).

## Git workflow

The first playable prototype is committed. For each later change, inspect the diff, run the checks, and commit only the related files:

```bash
git status
git diff --stat
```

For the Pages setup, the focused checkpoint is:

```text
chore: configure GitHub Pages deployment
```

Push a verified commit with `git push` to publish it. Keep each commit focused on one small feature or fix. Scoring, daily puzzles, direction clues, and sharing results are intentionally not implemented yet.
