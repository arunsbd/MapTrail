import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const basePath = process.env.BASE_PATH ?? "";
const siteUrl = "https://playmaptrail.com";
const outputDirectory = resolve("out");
const readOutput = (path) => readFileSync(resolve(outputDirectory, path), "utf8");
const homepageTitle = "MapTrail | Free Geography Guessing Game";
const homepageDescription = "Play MapTrail, a free online geography game. Guess US states and countries with Border Hunt and Clue Ladder, featuring maps, borders, and geography clues.";
const routes = [
  { path: "", file: "index.html", title: homepageTitle, description: homepageDescription },
  { path: "clue-ladder/", file: "clue-ladder/index.html", title: "MapTrail — Clue Ladder", description: "Guess a mystery U.S. state in seven clues. Explore all 50 states in Clue Ladder." },
];

function checkTag(html, selector, value) {
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => tag.includes(selector));
  assert.equal(tags.length, 1, `Expected one ${selector} tag`);
  assert.ok(tags[0].includes(value), `Unexpected value for ${selector}: ${tags[0]}`);
}

for (const route of routes) {
  const html = readOutput(route.file);
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
  assert.ok(head, `Missing head: ${route.file}`);
  assert.equal([...head.matchAll(/<title>/g)].length, 1, "Expected one title");
  assert.ok(head.includes(`<title>${route.title}</title>`));
  checkTag(head, 'name="description"', `content="${route.description}"`);
  checkTag(head, 'rel="canonical"', `href="${siteUrl}/${route.path}"`);
  checkTag(head, 'property="og:url"', `content="${siteUrl}/${route.path}"`);
  checkTag(head, 'property="og:type"', 'content="website"');
  checkTag(head, 'property="og:site_name"', 'content="MapTrail"');
  checkTag(head, 'property="og:title"', `content="${route.title}"`);
  checkTag(head, 'property="og:description"', `content="${route.description}"`);
  checkTag(head, 'property="og:image"', `content="${siteUrl}/social-preview.png"`);
  checkTag(head, 'property="og:image:alt"', 'content="MapTrail geography games: Border Hunt and Clue Ladder"');
  checkTag(head, 'name="twitter:card"', 'content="summary_large_image"');
  checkTag(head, 'name="twitter:title"', `content="${route.title}"`);
  checkTag(head, 'name="twitter:description"', `content="${route.description}"`);
  checkTag(head, 'name="twitter:image"', `content="${siteUrl}/social-preview.png"`);
  checkTag(head, 'name="robots"', 'content="index, follow, max-image-preview:large"');
  checkTag(head, 'rel="manifest"', `href="${basePath}/manifest.webmanifest"`);
  assert.doesNotMatch(head, /noindex|nofollow|arunsbd\.github\.io/);

  const jsonLd = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(jsonLd.length, 1, "Expected one JSON-LD graph per page");
  const data = JSON.parse(jsonLd[0][1]);
  assert.equal(data["@context"], "https://schema.org");
  assert.deepEqual(data["@graph"].map((entity) => entity["@type"]), ["WebSite", "WebApplication"]);
  const [website, application] = data["@graph"];
  assert.equal(website.url, `${siteUrl}/`);
  assert.equal(application.url, website.url);
  assert.equal(application.name, "MapTrail");
  assert.equal(application.applicationCategory, "GameApplication");
  assert.equal(application.operatingSystem, "Any");
  assert.equal(application.isAccessibleForFree, true);
  assert.equal(website.mainEntity["@id"], application["@id"]);
  assert.equal(application.isPartOf["@id"], website["@id"]);
  assert.doesNotMatch(jsonLd[0][1], /aggregateRating|review|award|downloadCount/);

  // Check rendered HTML, excluding React's serialized payload and executable scripts.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
  assert.equal([...markup.matchAll(/<h1\b/g)].length, 1, "Expected one initial H1 per page");
  assert.ok(markup.includes(`href="${basePath}/clue-ladder/"`), "Missing crawlable Clue Ladder link");
  const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.includes("/_next/"));
  assert.ok(assetUrls.some((url) => url.endsWith(".js")), "Missing JavaScript assets");
  assert.ok(assetUrls.some((url) => url.endsWith(".css")), "Missing stylesheet assets");
  for (const url of new Set(assetUrls)) {
    assert.ok(url.startsWith(`${basePath}/_next/`), `Wrong deployment prefix: ${url}`);
    assert.ok(existsSync(resolve(outputDirectory, decodeURIComponent(url.slice(basePath.length + 1)))), `Missing asset: ${url}`);
  }

  for (const match of markup.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const href = match[1].split(/[?#]/)[0];
    if (!href.startsWith("/")) continue;
    assert.ok(href.startsWith(`${basePath}/`), `Wrong link prefix: ${href}`);
    const relativePath = href.slice(basePath.length + 1);
    const file = relativePath.endsWith("/") || relativePath === "" ? `${relativePath}index.html` : relativePath;
    assert.ok(existsSync(resolve(outputDirectory, file)), `Broken internal link: ${href}`);
  }
  for (const image of markup.matchAll(/<img\b[^>]*>/g)) {
    assert.match(image[0], /\balt="/, "Image is missing alt text");
  }
  const icon = markup.match(/<link\b[^>]*rel="icon"[^>]*href="([^"]+)"/);
  assert.ok(icon, "Missing favicon");
  const iconPath = icon[1].split("?")[0];
  assert.ok(iconPath.startsWith(`${basePath}/`), "Favicon must retain deployment prefix");
  assert.ok(existsSync(resolve(outputDirectory, iconPath.slice(basePath.length + 1))), "Missing favicon file");
  console.log(`Metadata, JSON-LD, headings, links, and assets verified: /${route.path}`);
}

const html = readOutput("index.html").replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
assert.match(html, /<h1[^>]*>MapTrail · Border Hunt<\/h1>/);
assert.match(html, /MapTrail is a free online geography game/);
assert.match(html, /uses land borders and map hints/);
assert.match(html, /reveals geography clues/);
assert.match(html, /Opening your trail/);
assert.match(html, /Enable JavaScript in your browser to play MapTrail/);
assert.match(readOutput("clue-ladder/index.html"), /Start Clue Ladder/);
assert.ok(readOutput("clue-ladder/index.html").includes(`href="${basePath}/"`));

const socialImage = readFileSync(resolve(outputDirectory, "social-preview.png"));
assert.deepEqual(socialImage.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
assert.equal(socialImage.readUInt32BE(16), 1200);
assert.equal(socialImage.readUInt32BE(20), 630);
assert.ok(existsSync(resolve(outputDirectory, "404.html")), "Missing static 404 page");
assert.match(readOutput("404.html"), /name="robots" content="noindex"/);

const robots = readOutput("robots.txt");
assert.match(robots, /^User-Agent: \*$/m);
assert.match(robots, /^Allow: \/$/m);
assert.doesNotMatch(robots, /^Disallow:\s*\S/m);
assert.ok(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), "Wrong sitemap reference");

const sitemap = readOutput("sitemap.xml");
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(locations, routes.map((route) => `${siteUrl}/${route.path}`), "Sitemap must contain exactly the indexable routes");
assert.equal([...sitemap.matchAll(/<url>/g)].length, locations.length);
assert.match(sitemap, /<\/urlset>\s*$/);
console.log(`Static export SEO verified for ${basePath || "/"}; robots, sitemap, preview image, and 404 verified.`);
