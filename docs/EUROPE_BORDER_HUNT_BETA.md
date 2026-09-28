# Europe Border Hunt beta

Status: local beta implementation. This document applies the existing `MapTrail_Border_Hunt_World_Rules_v1.md` contract; it does not amend that contract.

## Authoritative roster

The playable roster is the intersection of:

1. MapTrail's 195-country world roster (193 UN member states plus the Holy See and the State of Palestine), and
2. the United Nations Statistics Division M49 Europe region.

That produces 44 playable countries:

Albania, Andorra, Austria, Belarus, Belgium, Bosnia and Herzegovina, Bulgaria, Croatia, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Vatican City (Holy See), Hungary, Iceland, Ireland, Italy, Latvia, Liechtenstein, Lithuania, Luxembourg, Malta, Moldova, Monaco, Montenegro, Netherlands, North Macedonia, Norway, Poland, Portugal, Romania, Russia, San Marino, Serbia, Slovakia, Slovenia, Spain, Sweden, Switzerland, Ukraine, and the United Kingdom.

M49 places Russia in Europe. It places Armenia, Azerbaijan, Cyprus, Georgia, Kazakhstan, and Türkiye in Asia, so they are outside this Europe beta even where a land border touches a playable country.

## Playability and components

All 44 roster countries are accepted guesses and shown on the map. Mystery targets are limited to the 40-country primary terrestrial component so every round can be solved entirely by the existing shortest-connection engine.

- Iceland and Malta are isolated under a strict land-border rule.
- Ireland and the United Kingdom form a real two-country land component.
- Those four countries are guess-only during the beta. A guess from outside the target's component correctly reports that no continuous route exists.
- There are no reviewed gateway connections in this release, so none were added.

## Boundary and adjacency sources

- Roster classification: [UN Statistics Division M49](https://unstats.un.org/unsd/methodology/m49/).
- Geometry: [Natural Earth Admin 0 Countries](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/), 1:10 million, version 5.1.1, default de facto boundary view.
- Adjacency basis: exact shared non-zero line segments in the same pinned Natural Earth geometry, followed by the explicit beta policy overrides. Point contact alone never creates a game connection.
- Licence: [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/) place the vector data in the public domain and permit personal, educational, and commercial use. Attribution is not required; MapTrail voluntarily displays `Made with Natural Earth`.

The reproducible, checksum-verified generator lives in `scripts/build-europe-geography.mjs`. Exact source metadata and processing steps live in `data/geography/europe/sources.json`. The complete replacement inventory and provenance audit live in [`EUROPE_MAP_PROVENANCE.md`](./EUROPE_MAP_PROVENANCE.md).

## Edge-case policy

### Microstates

Andorra, Liechtenstein, Monaco, San Marino, and Vatican City are full playable countries and mystery targets. The map adds minimum-size interaction markers at their geographic label points so their tiny polygons remain keyboard- and pointer-accessible. Their land borders are ordinary graph edges.

### Islands and non-land-connected countries

Water crossings do not count. Iceland and Malta therefore have no edges. Ireland–United Kingdom is retained because it is a real land border, but that two-country component is not used for beta targets. No ferry, bridge, tunnel, or proximity gateway is inferred.

### Enclaves and exclaves

Real internationally recognized land boundaries count regardless of whether they belong to the main body of a country. Kaliningrad therefore gives Russia land edges with Lithuania and Poland. Enclaved microstates connect to their surrounding country. Overseas territories do not create an edge for the sovereign state in the European game graph: for example, there is no France–Brazil, Spain–Morocco, or United Kingdom–Spain edge.

### Disputed territories

The beta does not add separate playable disputed-territory nodes. Kosovo is not a roster node under this M49-based policy. Natural Earth's default de facto polygons produce a Serbia–North Macedonia candidate but not a Serbia–Albania candidate; the beta policy continues to reject both possible Kosovo-derived pairings, so the generated game graph excludes Serbia–North Macedonia. Crimea and other disputed areas are not separate nodes and do not alter the reviewed sovereign-country adjacency list. The display polygons follow Natural Earth's default de facto view, while the graph remains the policy-reviewed game authority.

### Transcontinental countries

M49 placement controls roster membership rather than an ad hoc longitude rule. Russia is included. Türkiye, Cyprus, Armenia, Azerbaijan, Georgia, and Kazakhstan are excluded from this Europe roster. A border with an excluded country does not create a playable connection.

### Point contacts

A point-only contact is not a land-border edge. This matches the world-rules contract and prevents accidental connections produced by generalized polygons.

## Easy Mode direction

Europe Easy Mode computes the initial great-circle bearing from the selected country's maintained WGS84 gameplay anchor to the mystery country's anchor, then quantizes it to N, NE, E, SE, S, SW, W, or NW. This compass hint is additional feedback only: it does not change the border graph, shortest-path distance, heat scale, or bordering-country result.

The U.S. game intentionally does not receive directional hints in this milestone, so its established behavior remains unchanged.

## Data invariants

- 44 unique roster IDs.
- 40 mystery-target IDs in one connected component.
- 44 Natural Earth country features.
- Symmetric land-border adjacency with no unknown IDs or self edges.
- Five explicit microstate hit targets.
- No gateway edges.
