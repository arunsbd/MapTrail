# MapTrail SEO setup

Use this guide to verify Search Console ownership and monitor indexing. If verification or sitemap submission is already complete, continue with URL Inspection and monitoring.

## Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console) and add a **Domain property** named `playmaptrail.com` (no protocol or slash).
2. Choose DNS verification and copy the exact TXT record supplied by Google into your DNS provider. Use the root host (`@` or blank, following the provider's instructions). Add the record alongside existing records; preserve the GitHub Pages records. Wait for DNS propagation, click **Verify**, and keep the verification record afterward. See [Google's ownership verification instructions](https://support.google.com/webmasters/answer/9008080).
3. After an approved deployment, confirm these URLs return their actual files:
   - https://playmaptrail.com/robots.txt
   - https://playmaptrail.com/sitemap.xml
   - https://playmaptrail.com/social-preview.png
   In the **Sitemaps** report, submit `https://playmaptrail.com/sitemap.xml`. It should list only the homepage and `/clue-ladder/`. See [Sitemaps report help](https://support.google.com/webmasters/answer/7451001).
4. In **URL Inspection**, enter `https://playmaptrail.com/`, run **Test live URL**, and inspect the HTML and crawl/indexing status. Request indexing when the page is accessible. Repeat for `https://playmaptrail.com/clue-ladder/`. Review the user-declared and Google-selected canonical in the indexed report. See [URL Inspection help](https://support.google.com/webmasters/answer/9012289).
5. Monitor **Page indexing** and sitemap processing errors. Use **Performance > Search results** to track impressions, clicks, queries, and pages. Review periodically; indexing and search visibility may take time.

## Optional Bing setup

Open [Bing Webmaster Tools](https://www.bing.com/webmasters/), add and verify the site (or import the verified Search Console property if offered), and submit `https://playmaptrail.com/sitemap.xml`.

## Release verification

From this branch, run `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm exec tsc --noEmit`, and `pnpm check:export`. For custom-domain production, `BASE_PATH` should be empty. The existing workflow gets this from GitHub Pages settings.

After deployment, use [Schema Markup Validator](https://validator.schema.org/) to inspect the WebSite/WebApplication graph. Valid schema vocabulary does not guarantee a Google rich result; do not add fabricated ratings to satisfy rich-result eligibility. Recheck social sharing previews after platforms refresh cached metadata.

Technical SEO supports discovery and understanding. Sitemap submission and indexing requests do not guarantee indexing or rankings.
