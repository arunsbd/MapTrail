import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const basePath = process.env.BASE_PATH ?? "";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arunsbd.github.io/MapTrail";
const siteUrl = configuredSiteUrl.replace(/\/$/, "");
const outputDirectory = resolve("out");
const html = readFileSync(resolve(outputDirectory, "index.html"), "utf8");

assert.match(html, /MapTrail/);
assert.match(html, /MapTrail — Geography Games/);
assert.ok(html.includes(`rel="canonical" href="${siteUrl}/"`), "Missing canonical MapTrail URL");
assert.ok(html.includes(`rel="manifest" href="${basePath}/manifest.webmanifest"`), "Missing deployment-aware manifest URL");
assert.match(html, /application\/ld\+json/);
assert.match(html, /Opening your trail/);
assert.match(html, /Enable JavaScript in your browser to play MapTrail/);
assert.ok(existsSync(resolve(outputDirectory, "404.html")), "Missing static 404 page");
assert.ok(existsSync(resolve(outputDirectory, "manifest.webmanifest")), "Missing web manifest");
assert.ok(existsSync(resolve(outputDirectory, "robots.txt")), "Missing robots.txt");
assert.ok(existsSync(resolve(outputDirectory, "sitemap.xml")), "Missing sitemap.xml");

const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((url) => url.includes("/_next/"));

assert.ok(assetUrls.some((url) => url.endsWith(".js")), "Missing JavaScript assets");
assert.ok(assetUrls.some((url) => url.endsWith(".css")), "Missing stylesheet assets");

for (const url of new Set(assetUrls)) {
  assert.ok(
    url.startsWith(`${basePath}/_next/`),
    `Asset must use the deployment path ${basePath || "/"}: ${url}`,
  );
  const relativePath = decodeURIComponent(url.slice(basePath.length + 1));
  assert.ok(
    existsSync(resolve(outputDirectory, relativePath)),
    `Missing exported asset: ${url}`,
  );
}

console.log(`Static export verified for ${basePath || "/"}: ${new Set(assetUrls).size} assets found.`);

// Both game routes must survive direct navigation on GitHub Pages.
const ladderHtml = readFileSync(resolve(outputDirectory, 'clue-ladder/index.html'), 'utf8');
assert.match(ladderHtml, /MapTrail — Clue Ladder/);
assert.match(ladderHtml, /Start Clue Ladder/);
assert.ok(ladderHtml.includes(`href="${basePath}/"`), 'Clue Ladder must link back to Border Hunt');
assert.ok(ladderHtml.includes(`href="${basePath}/clue-ladder/"`), 'Clue Ladder link must retain the Pages prefix');
for (const match of ladderHtml.matchAll(/(?:src|href)="([^"]*\/_next\/[^\"]+)"/g)) {
  assert.ok(match[1].startsWith(`${basePath}/_next/`));
  assert.ok(existsSync(resolve(outputDirectory, decodeURIComponent(match[1].slice(basePath.length + 1)))));
}
console.log('Clue Ladder route and deployment-prefixed links verified.');
