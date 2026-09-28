# Border Hunt world architecture and gateway review plan

Status: groundwork only. This document does not approve a production gateway algorithm or a world dataset.

## Architecture decision

Border Hunt uses one versioned geography dataset contract and one unweighted connection engine. U.S., continental, and World modes select answer pools by `gameRegion`; they do not implement separate scoring engines. The initial TypeScript boundary is in `lib/geography/types.ts`, the generic breadth-first connection engine is in `lib/geography/connection.ts`, and the existing U.S. data adapter is in `data/geography/us-states.ts`.

Every playable place must provide a stable ID, display name, approved aliases, a polygon reference, terrestrial neighbors, and one MapTrail game region. Every published daily puzzle must retain the dataset version it used. Terrestrial edges must be symmetric and self-edge-free.

The current U.S. adapter deliberately preserves the existing rules: Census-derived shared boundaries, the two approved Four Corners point contacts, and isolated Alaska/Hawaii nodes. Practice targets remain the connected 48.

## Difficulty and direction

The current Easy, Intermediate, and Hard controls change map visibility and selection behavior; they do not currently calculate direction. World rule difficulty remains a separate capability decision: Classic has no directional arrow, while Easy/Explorer may add a general arrow after a valid guess. No placeholder arrow or misleading direction has been added in this phase.

## Gateway algorithm gate

Gateway scoring is blocked from production until the sovereign polygon policy, territorial exclusions, minimum-boundary candidate calculation, and manual override format are audited together. Minimum boundary-to-boundary distance may generate candidates, but it is never ordinary heat scoring and never creates a terrestrial-neighbor edge.

The evaluation fixture must record, for every case:

- dataset and polygon versions;
- primary-territory and remote-islet inclusion decisions;
- candidate gateway plus the next-best alternatives;
- minimum boundary distance as audit metadata only;
- the relevant land-network component;
- disputed geometry, point-contact, and water-only exclusions;
- reviewer decision, rationale, and any explicit versioned override;
- expected progressive clue output after guesses 4 through 8.

Required difficult-country fixtures:

| Target | Required audit focus |
|---|---|
| Sri Lanka | India relationship and delayed gateway-name reveal |
| Japan | remote islands and competing Korean/Russian/Chinese candidates |
| United Kingdom | island groups, Ireland, and overseas-territory exclusion |
| Madagascar | Mozambique-channel candidates and offshore islets |
| Iceland | Greenland/Faroe/Norway/UK candidate sensitivity |
| Cuba | Florida, Bahamas, Mexico, and water-only interpretation |
| Philippines | archipelago geometry and Borneo/Taiwan candidates |
| Australia | Papua New Guinea, Indonesia, and island-territory policy |
| New Zealand | main-island geometry and remote-islet exclusion |
| Fiji | multi-island boundary artifacts and regional gateway meaning |

## Progressive clue test plan

For a disconnected target, test that guesses 1–3 reveal no island, ocean, continent, kilometer, or gateway information. After guess 4, the engine may state whether a continuous land trail exists from the best relevant guess. After guess 5, it may state that water is required when true. After guess 6, it may reveal that a gateway exists without naming it; after guess 7, a broad region or relationship tier; after guess 8, the audited gateway country. Inapplicable clues must remain absent.

## Next ingestion step

Start North America by producing a reviewable, immutable candidate dataset—not a playable screen. Define the sovereign-entity table and territory policy first; ingest authoritative polygons; derive and manually audit terrestrial edges; assign exactly one MapTrail region per playable country; validate aliases and small-place interaction targets; then freeze a named dataset version. Only after those checks pass should the existing generic connection engine receive the new dataset.
