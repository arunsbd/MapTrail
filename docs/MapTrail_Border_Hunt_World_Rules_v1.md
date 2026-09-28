# MapTrail — Border Hunt World Rules v1

**Status:** Locked product contract for implementation planning<br>
**Prepared:** 2026-09-18<br>
**Product basis:** `PLAN.md`, the deployed U.S. Border Hunt, and `MapTrail_Clue_Ladder_Data_Spec.md`<br>
**Scope:** U.S. Border Hunt refinement, continental rollout, World Border Hunt, onboarding, and game discovery

## 1. Product identity

> **Border Hunt measures how places connect, not simply how far apart they are.**

Border Hunt is a geographic connection puzzle. The player finds a hidden place by interpreting land-border relationships, connection tiers, and progressively unlocked clues.

- **Clue Ladder asks:** What do you know about this place?
- **Border Hunt asks:** How does this place connect to the rest of the map?

World Border Hunt must not become a straight-line-distance or kilometer-based hot/cold game. Physical distance may be calculated internally to identify or audit gateway relationships, but it does not drive ordinary gameplay feedback.

## 2. Core objective

The game secretly selects one playable state or country. The player guesses places from the active map. After each valid guess, the game shows how closely that guess is connected to the mystery place.

A round ends when the player selects or submits the mystery place.

During a round, the game may communicate:

- whether the guess is correct;
- the shortest number of terrestrial border crossings when a land trail exists;
- a named heat tier plus a visible color;
- the special direct-neighbor `🔥 BORDERING` state;
- progressively unlocked land-network, water-crossing, and gateway clues when the target is disconnected;
- direction only in Easy/Explorer mode.

Color must never be the only carrier of meaning.

## 3. Required pre-game explanation

Every game mode must explain the player's job before the first round. A new player must not have to infer that a mystery place exists.

### 3.1 U.S. Border Hunt copy

**Title:** Find the mystery state

**Body:**

> A mystery state has been chosen. Start by guessing any state on the map or searching by name. After each guess, MapTrail shows how many state borders separate your guess from the mystery state. The hotter the result, the closer you are. 🔥 means your guess directly borders the mystery state, and green means you found it.

**Primary action:** `Start Border Hunt`

### 3.2 Continental and World Border Hunt copy

**Title:** Find the mystery country

**Body:**

> A mystery country has been chosen. Guess a country to begin. MapTrail follows land borders to show how closely your guess connects to the answer. Some countries cannot be reached by one continuous land trail; if you get stuck, new connection clues unlock as you play.

**Primary action:** `Start Border Hunt`

Do not explain gateways, islands, or the complete progressive hint sequence in the initial paragraph. A short expandable `How clues work` section may explain them without revealing the current answer.

### 3.3 Clue Ladder copy

**Title:** Find the mystery state from the clues

**Body:**

> Begin with a difficult clue and guess the mystery state whenever you are ready. Reveal more clues if you need them—but the earlier you solve it, the higher your score.

**Primary action:** `Start Clue Ladder`

When Clue Ladder expands to countries, replace “state” with “country” from the active dataset rather than maintaining duplicate hard-coded copy.

### 3.4 Intro behavior

- Show the explanation before a player's first round in each mode.
- Keep a clearly labeled `How to play` control available during play.
- A returning player may skip directly into the game if the site remembers that the mode explanation has been seen.
- The explanation must be keyboard accessible, screen-reader friendly, and usable on mobile.
- Do not force returning players through a blocking modal on every round.

## 4. Game discovery and navigation

MapTrail is one game platform with multiple modes. Border Hunt and Clue Ladder must not be hidden behind a small icon or an easily missed top-right control.

### 4.1 Required information architecture

Provide a prominent game chooser with at least:

1. **Border Hunt** — Follow borders and connection clues to find the mystery place.
2. **Clue Ladder** — Reveal clues and solve early for the highest score.
3. **Border Chain** — May appear as `Coming later` only if it is already part of the intended roadmap; it must not look playable when it is not.

### 4.2 Required behavior

- The active mode is named visibly in the page header.
- Desktop navigation shows labeled game names, not icon-only navigation.
- Mobile provides a clearly labeled `Games` or `Switch game` control with large touch targets.
- A first-time visitor sees a small game hub or unmistakable mode cards before entering a mode.
- During a game, switching modes remains easy but does not visually overpower the map.
- Existing daily/practice state must not be accidentally discarded without warning when switching modes.
- Preserve the current clean visual style and map-first layout.

## 5. Terrestrial borders

For Border Hunt, a border is a **terrestrial international boundary segment**.

The following do not count as normal Border Hunt edges:

- maritime boundaries;
- water-only boundaries;
- point contacts unless a versioned gameplay dataset explicitly opts in;
- overseas possessions creating adjacency for a parent country's primary gameplay geography.

Border relationships must be symmetric, versioned, and tested.

## 6. Normal land-connected scoring

When the guess and target are connected through terrestrial borders, compute the minimum number of border crossings using breadth-first search or an equivalent shortest unweighted path algorithm.

Example:

```text
Guess → Country A → Country B → Target
```

This result is `3 borders away`.

During the round, show the number but hide the intervening route. The complete shortest route may be shown after the round.

## 7. Locked heat scale

Use the same semantic tiers across U.S., continental, and World Border Hunt wherever a land-trail distance is available.

| Relationship | Required semantic feedback | Suggested visual family |
|---|---|---|
| Correct | `FOUND IT` | green |
| 1 border away | `🔥 BORDERING` and `1 border away` | fire/deep red |
| 2 borders away | `Very hot` and `2 borders away` | red |
| 3 borders away | `Hot` and `3 borders away` | orange |
| 4 borders away | `Warm` and `4 borders away` | amber |
| 5 borders away | `Mild` and `5 borders away` | yellow |
| 6 borders away | `Cool` and `6 borders away` | cyan/light blue |
| 7 borders away | `Cold` and `7 borders away` | blue |
| 8+ borders away | `Very cold` and the exact border count when known | indigo/purple |

Final hex values are implementation tokens, not data values. They must meet accessibility contrast requirements in the actual UI.

### 7.1 Immediate U.S. Border Hunt change

The current U.S. game must give an adjacent-state guess a visually special fire result:

> 🔥 **BORDERING!**<br>
> Your guess directly borders the mystery state.

Green remains exclusive to the correct answer. The guessed state should also use the fire/deep-red map treatment, and the guess history must include both a text label and an icon so the state is not communicated by color alone.

Do not change adjacency data merely to create this treatment. Reuse the current border graph and its existing distance calculation.

## 8. Disconnected geography

An island label does not control the rules. The engine asks whether a continuous terrestrial border path exists.

Early guesses must not immediately reveal that the target is an island or requires a sea crossing. In particular, ordinary feedback must not expose kilometer distance.

For disconnected relationships, the UI may initially show a neutral remote/connection state without explaining the reason. Exact wording must remain consistent with the progressive clue sequence in Section 9.

## 9. Progressive connection clues

The following sequence is locked for Classic mode unless playtesting supports a versioned adjustment:

| Trigger | Newly available information |
|---:|---|
| Guesses 1–3 | Core heat/connection feedback only; no island, ocean, continent, kilometer, or gateway disclosure |
| After guess 4 | `🌐 LAND TRAIL CLUE` — reveal whether the target can be reached from the player's best relevant guess using only land borders |
| After guess 5 | `🌊 CROSSING CLUE` — if applicable, reveal that reaching the target requires crossing water |
| After guess 6 | `🚪 GATEWAY CLUE` — reveal that a gateway relationship exists, but do not name it |
| After guess 7 | Reveal a broad gateway clue such as the gateway's MapTrail region or relationship tier |
| After guess 8 | Reveal the actual gateway country |

Guidelines:

- A hint appears only when applicable; never display a false water or gateway clue to satisfy a schedule.
- The gateway name is deliberately delayed because it may nearly reveal targets such as Sri Lanka.
- Do not use `different continent` as the main disconnected rule.
- Do not reveal exact kilometer distance during the round.
- Post-game educational facts may include audited nearest-boundary distance.

## 10. Gateway definition

A **Gateway Country** is a sovereign country used by MapTrail as the closest meaningful geographic connection into a target's disconnected land network.

Gateway never means that two countries share a legal land border.

Player-facing language must say `Gateway Country`, `water crossing`, or another unambiguous connection term. It must never say `neighbor` or `bordering` for a gateway-only relationship.

### 10.1 Data and audit requirements

- Candidate gateways originate from minimum boundary-to-boundary distance between the versioned sovereign polygons used by MapTrail.
- Primary gameplay territory and overseas-territory policy must be applied before calculation.
- Results must be manually audited for unintuitive polygon artifacts, remote islets, enclaves, disputed geometry, or a technically nearest country that creates poor gameplay.
- Any override must be explicit, documented, and stored in the versioned geography dataset—not buried in UI code.
- The same dataset version must reproduce the same gateway results.

### 10.2 Engineering item not yet frozen

The product behavior is locked, but the exact **Trail Distance + Gateway graph algorithm** is not yet approved for all world geography. Do not silently invent it in production code.

Before broad World implementation, create fixtures and compare candidate algorithms for at least:

- Sri Lanka;
- Japan;
- United Kingdom;
- Madagascar;
- Iceland;
- Cuba;
- Philippines;
- Australia;
- New Zealand;
- Fiji.

The chosen algorithm must keep heat meaningful for island chains and multiple disconnected land networks without reducing the game to physical distance. The decision and audited fixtures become a separate versioned engineering specification.

## 11. Continents and MapTrail regions

Continents do not control heat or connection scoring.

Each playable country receives exactly one `game_region` for mode filtering:

```text
North America
South America
Europe
Africa
Asia
Oceania
```

This classification is a MapTrail gameplay convention. It determines the country pool and map filter for continental modes but does not alter World-mode border relationships.

Transcontinental and politically sensitive classifications must be explicit in the versioned country table.

## 12. Rollout strategy

Build one global data model and one Border Hunt engine, then release and playtest with filters.

Preferred product rollout:

1. U.S. States — existing mode, with onboarding/navigation/fire refinements.
2. North America.
3. Europe.
4. South America.
5. Africa.
6. Asia.
7. Oceania.
8. World — expert/boss mode.

Continental modes remain permanent learning modes; they are not temporary demos.

Suggested internal principle:

```text
one world dataset + one connection engine + multiple region filters
```

Do not create a separate bespoke engine for every continent.

## 13. Difficulty modes

### Classic

- heat tier;
- border-hop or connection feedback;
- progressive disconnected clues;
- no direction arrow.

### Easy / Explorer

- everything in Classic;
- a general directional arrow after each valid guess;
- optional more explanatory feedback.

### Hard — future, not required now

- reduced numeric detail;
- no direction;
- delayed or manually requested progressive clues.

Direction is a difficulty aid, not part of the core scoring model. If the current U.S. game already shows direction, preserve it during the first refactor and place it behind a difficulty setting only when that setting is implemented completely.

## 14. Country universe and territories

The proposed v1 World pool is:

> **193 UN member states + Palestine + Vatican City = 195 playable countries**

This is a product convention, not a claim that every political-status question is uncontested.

Overseas possessions do not automatically create ordinary adjacency for the parent country's primary gameplay geography. Otherwise, France could behave as Brazil's direct Border Hunt neighbor through French Guiana, which is undesirable for this game's default logic.

The geography dataset must explicitly define:

- playable sovereign entities;
- primary polygon set used for gameplay;
- displayed territories;
- land-border edges;
- excluded water-only and point-contact relationships;
- MapTrail region;
- gateway candidates and approved overrides;
- dataset version.

## 15. Map interaction

World and continental modes must support:

- map selection;
- country search by name and approved aliases;
- zoom and pan;
- visible labels or accessible names;
- keyboard operation;
- mobile-friendly touch targets;
- enlarged or alternative hit targets for microstates and small islands;
- identical validation whether a guess came from search or the map.

Tiny countries must never be effectively unplayable because their polygons are too small to click.

## 16. Post-game learning

After the player wins, reveal a shortest valid connection route from selected guesses to the target.

Land example:

```text
Germany → Austria → Slovenia → Croatia
```

Disconnected example:

```text
Pakistan → India → 🌊 → Sri Lanka
```

The route reveal may include:

- terrestrial border steps;
- a clearly marked gateway crossing;
- the dataset version;
- an audited nearest-boundary fact as optional educational context.

Do not reveal intermediary route countries during normal play if doing so would disclose the answer too quickly.

## 17. Data versioning

Ship world geography as an immutable, named dataset such as:

```text
MapTrail World Geography Dataset v1.0
```

It freezes:

- playable countries;
- polygons;
- border graph;
- region membership;
- territory policy;
- gateway relationships;
- explicit exceptions and overrides.

Updates create new versions. A published daily puzzle must retain the geography version it used.

## 18. Accessibility and clarity requirements

- Every color tier has a text label.
- `🔥 BORDERING` also states `1 border away` or `directly borders the mystery place`.
- Focus states are visible.
- Instructions work without hover.
- Map regions have accessible names.
- Motion honors reduced-motion preferences.
- Feedback remains legible in common forms of color-vision deficiency.
- The initial objective can be understood in under 30 seconds.

## 19. Acceptance criteria for the next implementation phase

### Existing U.S. product

- A first-time player is explicitly told that a mystery state has been chosen and how guesses work.
- Adjacent guesses show `🔥 BORDERING` in the map, result card, and history without using color alone.
- Correct guesses remain green.
- Border Hunt and Clue Ladder are visibly presented as game modes in one MapTrail product.
- The current responsive design, game logic, daily/practice behavior, scores, statistics, and sharing do not regress.

### Architecture and World groundwork

- Game rules are separated from UI styling.
- Dataset/region selection is not hard-coded into a second duplicate game engine.
- Border relationships validate as symmetric and self-edge-free.
- Continents/regions filter answer pools but do not control heat.
- No kilometer-based gameplay scoring is introduced.
- No unreviewed gateway algorithm is shipped as authoritative.
- Difficult gateway fixtures exist before broad World release.

## 20. Locked and deferred decisions

### Locked

- Connection—not distance—is Border Hunt's identity.
- `🔥 BORDERING` is the direct-neighbor state.
- Green is correct only.
- More heat/color tiers are used.
- Sea and gateway information unlock progressively.
- Kilometer distance is not ordinary gameplay feedback.
- Continents are modes/filters, not scoring logic.
- Easy/Explorer mode includes directional arrows.
- One global engine supports continent filters and World mode.
- Mode discovery and pre-game instructions are first-class requirements.

### Deferred pending evidence or playtesting

- Final accessible hex colors.
- Exact score penalties and bonuses.
- Final Trail Distance + Gateway algorithm.
- Full country-to-region assignment table.
- Political/disputed-border exception table.
- Hard-mode details.
- Whether progressive clues unlock automatically or appear as a no-penalty/penalty action.

## 21. Guiding sentence for design and code review

> A new player should immediately know that MapTrail has chosen a mystery place, know how to make a first guess, understand what the resulting connection feedback means, and see that Border Hunt is one of several MapTrail games.
