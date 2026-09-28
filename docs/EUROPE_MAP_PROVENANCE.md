# Europe map provenance and Natural Earth migration

Status: **Natural Earth replacement validated locally and ready for review before commit**

This record inventories the prior source lineage, pins the replacement, and defines how MapTrail proves that Europe geometry and adjacency no longer depend on the previous restricted source.

## Pinned replacement

- Dataset: Natural Earth Admin 0 Countries
- Scale: 1:10 million
- Theme version: 5.1.1
- Boundary view: Natural Earth default de facto view
- Format: GeoJSON, WGS84 longitude/latitude
- Official catalog: <https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/>
- Pinned upstream file: <https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_10m_admin_0_countries.geojson>
- SHA-256: `239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255`
- Retrieved and verified: 2026-09-20

`scripts/build-europe-geography.mjs` refuses to generate outputs unless the downloaded bytes match that checksum.

## Licence result

Natural Earth's [terms of use](https://www.naturalearthdata.com/about/terms-of-use/) place all Natural Earth raster and vector data on the site in the public domain. They expressly allow modification, electronic dissemination, and commercial use without permission. Crediting Natural Earth is not required, but MapTrail voluntarily displays `Made with Natural Earth` and records the source here.

Result: the previous map-data commercial-use blocker is removed for these Natural Earth artifacts. This is a provenance conclusion, not legal advice about unrelated MapTrail content or third-party dependencies.

## Previous-source inventory and disposition

| Artifact | Previous dependency | Natural Earth disposition |
| --- | --- | --- |
| `data/geography/europe/countries.geo.json` | Downloaded country polygons | Fully regenerated from the pinned Natural Earth file |
| `data/geography/europe/countries.ts` | Hand-maintained source codes and geography anchors | Source IDs, spherical centroids, label anchors, and direction anchors now come from generated Natural Earth metadata; names and aliases remain MapTrail product data |
| `data/geography/europe/borders.ts` | Hand-maintained, source-reviewed adjacency | Replaced with typed access to independently generated Natural Earth adjacency |
| `data/geography/europe/map.ts` | Fixed projection tuned to the previous polygons | Projection now fits Natural Earth-derived Europe display bounds |
| `data/geography/europe/sources.json` | Previous-source metadata and terms | Replaced with the pinned Natural Earth version, URL, checksum, licence, and processing contract |
| `scripts/build-europe-geography.mjs` | Per-country source downloader | Replaced with one checksum-gated Natural Earth pipeline |
| `components/BorderHuntGame.tsx` | Previous-source attribution | Replaced with voluntary Natural Earth provenance text |
| `tests/europe-geography.test.ts`; existing `tests/direction.test.ts` | Source and reviewed-graph expectations; direction coverage dynamically consumes the country anchors | Provenance checks now validate the Natural Earth checksum, generated centroids, anchors, map bounds, and adjacency; the unchanged direction test was rerun against every regenerated anchor pair |
| `docs/EUROPE_BORDER_HUNT_BETA.md` | Previous source, terms, and disputed-boundary explanation | Rewritten for Natural Earth and the preserved MapTrail policy |
| `docs/GISCO_COMMERCIAL_USE_FOLLOW_UP.md` | Open commercial-use gate | Removed and superseded by this completed migration record |
| `.next/` and `out/` | Generated caches could retain old geometry or attribution | Purged before final validation, then rebuilt only from the Natural Earth working tree |
| `.tmp-ne-10m-admin0-v5.1.1.geojson` | Temporary checksum/schema inspection download | Removed after generated outputs were verified |

## Reproducible processing

1. Download the pinned Natural Earth GeoJSON and verify its SHA-256.
2. Select exactly the existing 44-country MapTrail Europe roster by Natural Earth `ADM0_A3`.
3. Copy those source geometries without additional simplification.
4. Compute each spherical centroid with `d3-geo` `geoCentroid`.
5. Use Natural Earth `LABEL_X` and `LABEL_Y` for the map label point and Easy Mode direction anchor.
6. Derive the Europe display bounds from selected-source vertices inside the documented display window (`25°W–45°E`, `35°N–72°N`). This prevents transcontinental Russia and overseas parts from shrinking the Europe view while retaining their source geometry.
7. Build raw adjacency candidates only where two roster polygons share at least one exact non-zero line segment. Point-only contact does not count.
8. Record all raw candidates, then apply the existing disputed-territory policy.
9. Order neighbor arrays with the established deterministic BFS tie-break order so equal-length victory routes remain stable; this ordering does not add or remove relationships.
10. Write the country GeoJSON, generated country metadata, and generated adjacency manifest.

## Adjacency comparison

Natural Earth produces 82 roster-to-roster candidates. The existing Kosovo policy rejects `MKD-SRB`, leaving 81 playable edges. Natural Earth does not produce an `ALB-SRB` candidate, but that pairing remains explicitly rejected by policy.

The final 81-edge game graph is unchanged from the audited Europe Beta. Therefore heat distances, the 40-country connected target pool, and victory routes remain functionally stable even though every edge was independently regenerated.

All 44 source geometry records, centroids, and label/direction anchors were regenerated. Every label-anchor coordinate changed numerically; 43 moved by more than one metre. Across the 44-country roster, 107 of 1,892 ordered Easy Mode country pairs changed eight-way compass sector because Natural Earth label points replaced the previous hand-maintained anchors. These are expected source-lineage changes, and every ordered pair still produces a valid geography-aware direction.

## Preserved policy

- Russia stays in the M49-Europe roster; its Natural Earth label anchor is used for direction guidance, and Kaliningrad retains the Poland and Lithuania edges.
- Türkiye and Cyprus remain outside the Europe roster under M49 placement.
- Kosovo remains outside the roster, and possible Kosovo-derived Serbia pairings remain excluded.
- Andorra, Liechtenstein, Monaco, San Marino, and Vatican City remain targets with enlarged markers and accessible shortcut buttons.
- Iceland and Malta remain isolated guess-only countries; Ireland and the United Kingdom remain a separate guess-only component.
- Enclaves and recognized exclaves count; overseas territories do not create playable sovereign-state edges.
- No ferry, bridge, tunnel, point-contact, or invented gateway is added.

## Remaining uncertainties

- Natural Earth is generalized cartographic data, not a cadastral or treaty-boundary authority.
- Its default file represents a de facto boundary view. MapTrail's roster and graph policy intentionally remain separate, explicit product decisions.
- Natural Earth label points are cartographic anchors, not guaranteed geometric interior points. Tiny countries remain playable through accessible controls independent of polygon size.
- A future Natural Earth release must not silently replace 5.1.1; changing versions requires a new checksum, regenerated outputs, edge diff, visual comparison, and full validation.

## Local validation result

- The checksum-gated generator reproduced 44 country features and 81 final land-border edges from the pinned source.
- The full automated suite passed: 19 test files and 168 tests.
- ESLint, TypeScript, the Next.js production build, and the static-export check passed.
- A forbidden-marker scan found no previous-source names or country-file identifiers in application source, generated geography, tests, `.next/`, or `out/`. The only remaining mention is this historical migration record and the pending Git deletion entry for the superseded follow-up document.
- Desktop and 390×844 browser checks covered map scale, all 44 accessible country paths, five small-country shortcuts, heat and directional feedback, a complete winning route, U.S. Border Hunt, and Clue Ladder progression.
