# MapTrail technical SEO audit

Audit date: October 11, 2026. Branch: `codex/maptrail-technical-seo`.
Baseline: `e443a98a981b2561e76541d497cf1bc7e9445a6d`, verified against GitHub `arunsbd/MapTrail` main.
The original checkout contains unfinished North America work on another branch. This pass uses an isolated managed worktree and leaves those files intact.

## Initial findings

| Area | Existing behavior | Action |
| --- | --- | --- |
| Homepage metadata | MapTrail title and description, metadataBase, correct custom-domain canonical, Open Graph and large Twitter card | Improve title/description; retain canonical and social metadata |
| Crawl files | Existing force-static sitemap and robots Metadata API routes | Preserve them; strengthen checks of their contents |
| Sitemap | Homepage and `/clue-ladder/`; no invented region URLs | Preserve the two routes |
| Live HTTP | Homepage, Clue Ladder, robots and sitemap return 200; no X-Robots-Tag restriction | Confirmed with HTTP requests |
| Initial homepage HTML | Loading text and developer footer; no H1 or links to the games | Semantic H1 in loading markup; small permanent visible explanation and links |
| Clue Ladder | Static initial content, its own canonical/title/description; nested social metadata overrides omit preview image; Twitter uses summary | Reuse the existing large social image explicitly |
| Structured data | One WebSite object in the root layout | Replace with one connected WebSite/WebApplication graph |
| Icons | No favicon in app or public; manifest already exists | Add a small SVG pin icon matching the existing colors |
| Analytics | PostHog initialized through instrumentation-client; existing capture calls and deployment variables | Preserve all analytics files, gameplay events, and configuration |

The live homepage and existing navigation expose U.S. States and Europe Beta in Border Hunt. Clue Ladder identifies U.S. states. North America is in the unfinished original checkout, so this branch does not advertise it.

## Static hosting compatibility

Next.js 16.3.3 uses App Router, `output: "export"`, `trailingSlash: true`, and an environment-controlled `BASE_PATH`. `pnpm build` emits the HTML and assets in `out/`.
The existing GitHub Pages workflow tests, lints, builds, checks output and uploads `out/`; it deploys on pushes to main or manual workflow dispatch.
Build-time Server Components, static Metadata API exports, native JSON-LD script tags and force-static metadata routes work with this architecture.
No request-time server logic, redirects, middleware, Server Actions, image optimization service or new dependencies were introduced. Deployment configuration is unchanged.

## Files changed

- `lib/site.ts`: requested SEO title and description; central shared social image definition; production URL retained.
- `app/layout.tsx`: explicit index/follow directives, large image preview permission, shared image, deployment-aware manifest reference, and connected WebSite/WebApplication JSON-LD with safe serialization.
- `app/clue-ladder/page.tsx`: explicit Open Graph image and large Twitter card without losing its route-specific metadata.
- `app/page.tsx`: about 65 words of visible game explanation below gameplay, with normal links to the existing game routes and existing design tokens.
- `components/BrowserBorderHunt.tsx`: loading label changed from paragraph to H1; identical styling. The randomly selected game remains browser initialized.
- `app/icon.svg`: static vector favicon; no generated-image service or dependency.
- `scripts/check-static-export.mjs`: regression checks for initial HTML metadata uniqueness, canonical URLs, indexing directives, structured data, H1, content, links, image alt attributes, preview dimensions, favicon, manifest, asset prefixes, sitemap routes, robots rules, and 404 noindex.
- `SEO_SETUP.md`: manual Search Console/DNS/sitemap/indexing and optional Bing instructions.
- `docs/SEO_AUDIT.md`: audit, validation and next-phase recommendations.

The existing `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, social image and deployment workflow are reused. Gameplay components, datasets, analytics implementation and dependencies are unchanged.

WebApplication is a factual fit for a JavaScript browser game ([Schema.org](https://schema.org/WebApplication)). The graph identifies one application and one website with stable IDs. It contains no reviews, ratings, awards or popularity metrics. VideoGame was evaluated, but an additional overlapping entity is unnecessary.

## Validation

- `pnpm lint`: passes, with one existing `react-hooks/exhaustive-deps` warning for `puzzles` in `components/ClueLadderGame.tsx:87`.
- `pnpm test`: 20 files, 173 tests passed, including game and analytics tests.
- `pnpm build`: passes; all routes are prerendered static output.
- `pnpm exec tsc --noEmit`: passes independently.
- `pnpm check:export`: passes for custom-domain root and `BASE_PATH=/MapTrail`. Final output rebuilt at the root.
- XML parsing: generated sitemap and SVG parse successfully. Sitemap contains exactly the two existing playable routes, with production-domain URLs.
- Browser: both games hydrate and start; Border Hunt submits a guess and shows border-distance feedback; Clue Ladder advances after a skip. Direct navigation to Clue Ladder works.
- Responsive checks: homepage at 1440x900 and 390x844; Clue Ladder at 390x844. No horizontal overflow; the new explanation wraps naturally. Existing viewport, focus styles, semantic links and image alternatives remain.
- `git diff --check`: passes.

All requested local commands were executable. Hosted social-platform preview refreshes, external Schema Markup Validator and actual Google/Bing indexing were not performed. JSON-LD was parsed and checked locally against the intended entities and vocabulary. No performance benchmark was run; changes add static markup and a small icon without new client libraries.
Web retrieval tools blocked the live XML URLs, but direct HTTP checks confirmed the existing files return 200 with correct content types; this is not a production failure.

At the time of the initial audit, no commit, push, deployment, Search Console or DNS change had been performed.

## Phase 2

1. Keep `/clue-ladder/` as the existing distinct game route; consider a concise static how-to-play section if users need it.
2. Consider `/border-hunt/` only alongside a genuine homepage/catalog redesign and navigation plan. Do not clone the current homepage gameplay onto a second equivalent route.
3. Consider `/us-states/` and `/europe/` (or routes nested under Border Hunt) when they directly open the appropriate playable region and include meaningful region-specific rules and content. Define canonical ownership and saved-progress behavior first.
4. Consider `/north-america/` after that gameplay is approved and released. Do not create an empty page now.
5. Use Search Console query/indexing data to guide useful content improvements and measure Core Web Vitals on real devices. Avoid keyword-only pages and unsupported comparisons or ranking promises.

See [SEO_SETUP.md](../SEO_SETUP.md) for the owner's remaining manual steps.
