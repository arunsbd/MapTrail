import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const basePath = process.env.BASE_PATH ?? "";
const siteUrl = "https://playmaptrail.com";
const outputDirectory = resolve("out");
const html = readFileSync(resolve(outputDirectory, "index.html"), "utf8");

assert.match(html, /MapTrail/);
const description = "Play interactive geography games like Border Hunt and Clue Ladder. Test your knowledge of U.S. states, Europe, and more maps coming soon.";
assert.ok(html.includes("<title>MapTrail — Geography Games</title>"), "Missing homepage title");
assert.ok(html.includes(`name="description" content="${description}"`), "Missing homepage description");
assert.ok(html.includes(`rel="canonical" href="${siteUrl}/"`), "Missing canonical MapTrail URL");
assert.ok(html.includes(`property="og:url" content="${siteUrl}/"`), "Open Graph URL must use the production domain");
assert.ok(html.includes('property="og:title" content="MapTrail — Geography Games"'), "Missing Open Graph title");
assert.ok(html.includes(`property="og:description" content="${description}"`), "Missing Open Graph description");
assert.ok(html.includes('property="og:site_name" content="MapTrail"'), "Missing Open Graph site name");
assert.ok(html.includes(`property="og:image" content="${siteUrl}/social-preview.png"`), "Missing production Open Graph image URL");
assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), "Missing large Twitter card metadata");
assert.ok(html.includes('name="twitter:title" content="MapTrail — Geography Games"'), "Missing Twitter title");
assert.ok(html.includes(`name="twitter:description" content="${description}"`), "Missing Twitter description");
assert.ok(html.includes(`name="twitter:image" content="${siteUrl}/social-preview.png"`), "Missing production Twitter image URL");
const socialImage = readFileSync(resolve(outputDirectory, "social-preview.png"));
assert.deepEqual(socialImage.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "Social preview must be a PNG");
assert.equal(socialImage.readUInt32BE(16), 1200, "Social preview must be 1200 pixels wide");
assert.equal(socialImage.readUInt32BE(20), 630, "Social preview must be 630 pixels high");
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
