import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { geoCentroid } from "d3-geo";

const here = dirname(fileURLToPath(import.meta.url));
const dataDirectory = resolve(here, "../data/geography/europe");
const sources = JSON.parse(await readFile(resolve(dataDirectory, "sources.json"), "utf8"));

const countryCodes = [
  "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CZE", "DNK",
  "EST", "FIN", "FRA", "DEU", "GRC", "VAT", "HUN", "ISL", "IRL", "ITA",
  "LVA", "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD",
  "NOR", "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP",
  "SWE", "CHE", "UKR", "GBR",
];
const countryCodeSet = new Set(countryCodes);
const routeTieBreakCodes = [...countryCodes].sort();
const bosniaIndex = routeTieBreakCodes.indexOf("BIH");
const bulgariaIndex = routeTieBreakCodes.indexOf("BGR");
[routeTieBreakCodes[bosniaIndex], routeTieBreakCodes[bulgariaIndex]] = [
  routeTieBreakCodes[bulgariaIndex],
  routeTieBreakCodes[bosniaIndex],
];
const latviaIndex = routeTieBreakCodes.indexOf("LVA");
const lithuaniaIndex = routeTieBreakCodes.indexOf("LTU");
[routeTieBreakCodes[latviaIndex], routeTieBreakCodes[lithuaniaIndex]] = [
  routeTieBreakCodes[lithuaniaIndex],
  routeTieBreakCodes[latviaIndex],
];
const routeTieBreakOrder = new Map(routeTieBreakCodes.map((code, index) => [code, index]));
const policyRejectedEdges = new Set(["ALB-SRB", "MKD-SRB"]);
const displayWindow = { west: -25, south: 35, east: 45, north: 72 };

function edgeKey(left, right) {
  return [left, right].sort().join("-");
}

function geometryRings(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  throw new Error(`Unsupported Natural Earth geometry type: ${geometry.type}`);
}

function visitCoordinates(value, visitor) {
  if (typeof value[0] === "number") {
    visitor(value);
    return;
  }
  for (const child of value) visitCoordinates(child, visitor);
}

const response = await fetch(sources.polygons.downloadUrl);
if (!response.ok) {
  throw new Error(`${response.status} ${response.statusText}: ${sources.polygons.downloadUrl}`);
}
const sourceBytes = Buffer.from(await response.arrayBuffer());
const actualChecksum = createHash("sha256").update(sourceBytes).digest("hex");
if (actualChecksum !== sources.polygons.sha256) {
  throw new Error(`Natural Earth checksum mismatch: expected ${sources.polygons.sha256}, received ${actualChecksum}`);
}

const sourceCollection = JSON.parse(sourceBytes.toString("utf8"));
if (sourceCollection.type !== "FeatureCollection") {
  throw new Error("Natural Earth source is not a GeoJSON FeatureCollection");
}

const sourceFeatures = sourceCollection.features.filter((feature) =>
  countryCodeSet.has(feature.properties?.ADM0_A3),
);
if (sourceFeatures.length !== countryCodes.length) {
  throw new Error(`Expected ${countryCodes.length} roster features, received ${sourceFeatures.length}`);
}

const featureByCode = new Map(sourceFeatures.map((feature) => [feature.properties.ADM0_A3, feature]));
for (const code of countryCodes) {
  if (!featureByCode.has(code)) throw new Error(`Natural Earth is missing roster country ${code}`);
}

const segmentOwners = new Map();
for (const [code, feature] of featureByCode) {
  for (const ring of geometryRings(feature.geometry)) {
    for (let index = 1; index < ring.length; index += 1) {
      const start = ring[index - 1].join(",");
      const end = ring[index].join(",");
      if (start === end) continue;
      const key = start < end ? `${start}|${end}` : `${end}|${start}`;
      const owners = segmentOwners.get(key) ?? new Set();
      owners.add(code);
      segmentOwners.set(key, owners);
    }
  }
}

const candidateEdges = new Set();
for (const owners of segmentOwners.values()) {
  if (owners.size < 2) continue;
  const codes = [...owners].sort();
  for (let left = 0; left < codes.length; left += 1) {
    for (let right = left + 1; right < codes.length; right += 1) {
      candidateEdges.add(edgeKey(codes[left], codes[right]));
    }
  }
}

const includedEdges = [...candidateEdges]
  .filter((edge) => !policyRejectedEdges.has(edge))
  .sort();
const excludedCandidateEdges = [...candidateEdges]
  .filter((edge) => policyRejectedEdges.has(edge))
  .sort();
const neighbors = Object.fromEntries(countryCodes.map((code) => [code, []]));
for (const edge of includedEdges) {
  const [left, right] = edge.split("-");
  neighbors[left].push(right);
  neighbors[right].push(left);
}
for (const code of countryCodes) {
  neighbors[code].sort((left, right) => routeTieBreakOrder.get(left) - routeTieBreakOrder.get(right));
}

const displayBounds = {
  west: Number.POSITIVE_INFINITY,
  south: Number.POSITIVE_INFINITY,
  east: Number.NEGATIVE_INFINITY,
  north: Number.NEGATIVE_INFINITY,
};
for (const feature of sourceFeatures) {
  visitCoordinates(feature.geometry.coordinates, ([longitude, latitude]) => {
    if (
      longitude < displayWindow.west || longitude > displayWindow.east ||
      latitude < displayWindow.south || latitude > displayWindow.north
    ) return;
    displayBounds.west = Math.min(displayBounds.west, longitude);
    displayBounds.south = Math.min(displayBounds.south, latitude);
    displayBounds.east = Math.max(displayBounds.east, longitude);
    displayBounds.north = Math.max(displayBounds.north, latitude);
  });
}
if (Object.values(displayBounds).some((value) => !Number.isFinite(value))) {
  throw new Error("Unable to derive Europe display bounds from Natural Earth geometry");
}

const countries = {};
const outputFeatures = countryCodes.map((code) => {
  const feature = featureByCode.get(code);
  const [centroidLongitude, centroidLatitude] = geoCentroid(feature);
  const labelLongitude = Number(feature.properties.LABEL_X);
  const labelLatitude = Number(feature.properties.LABEL_Y);
  countries[code] = {
    featureId: feature.properties.ADM0_A3,
    sourceName: feature.properties.NAME_EN ?? feature.properties.ADMIN ?? code,
    centroid: { longitude: centroidLongitude, latitude: centroidLatitude },
    labelPoint: {
      longitude: Number.isFinite(labelLongitude) ? labelLongitude : centroidLongitude,
      latitude: Number.isFinite(labelLatitude) ? labelLatitude : centroidLatitude,
    },
  };
  return {
    type: "Feature",
    id: code,
    properties: {
      code,
      sourceFeatureId: feature.properties.ADM0_A3,
      sourceName: feature.properties.NAME_EN ?? feature.properties.ADMIN ?? code,
    },
    geometry: feature.geometry,
  };
});

const countryCollection = {
  type: "FeatureCollection",
  source: sources.polygons.title,
  sourceVersion: sources.polygons.version,
  sourceUrl: sources.polygons.downloadUrl,
  sourceSha256: sources.polygons.sha256,
  features: outputFeatures,
};
const generatedMetadata = {
  datasetVersion: sources.version,
  sourceSha256: sources.polygons.sha256,
  displayWindow,
  displayBounds,
  countries,
};
const generatedAdjacency = {
  datasetVersion: sources.version,
  sourceSha256: sources.polygons.sha256,
  method: "Exact shared non-zero polygon segments in Natural Earth Admin 0 Countries 1:10m, followed by explicit MapTrail policy exclusions",
  candidateEdges: [...candidateEdges].sort(),
  policyRejectedEdges: [...policyRejectedEdges].sort(),
  excludedCandidateEdges,
  includedEdges,
  neighbors,
};

await mkdir(dataDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(dataDirectory, "countries.geo.json"), `${JSON.stringify(countryCollection)}\n`, "utf8"),
  writeFile(resolve(dataDirectory, "countries.generated.json"), `${JSON.stringify(generatedMetadata, null, 2)}\n`, "utf8"),
  writeFile(resolve(dataDirectory, "adjacency.generated.json"), `${JSON.stringify(generatedAdjacency, null, 2)}\n`, "utf8"),
]);

console.log(`Verified Natural Earth SHA-256 ${actualChecksum}`);
console.log(`Wrote ${outputFeatures.length} country features and ${includedEdges.length} policy-reviewed land borders`);
