# MapTrail — Product & Build Plan

## 1. Product Vision

**MapTrail** is a web-based geography game platform built around short, replayable daily challenges.

The first release focuses on the **50 U.S. states**, with a later expansion to countries and other regions of the world.

The goal is to make geography feel like a game of deduction, strategy, and pattern recognition rather than a traditional quiz.

### Core principles

- Easy to understand in under 30 seconds
- Playable in 2–5 minutes
- Mobile-first
- Daily challenge + unlimited practice
- Educational without feeling like homework
- Shareable results
- No account required for the first release
- Built so the same engine can later support countries, provinces, regions, cities, and other geography datasets

---

## 2. Initial Game Modes

### A. Border Hunt

The player tries to identify a mystery state.

After every guess, the game provides geographic feedback.

Possible feedback:

- Number of state-border crossings from the mystery state
- General direction toward the mystery state
- Hot / warm / cold indicator
- Whether the guessed state directly borders the mystery state

Example:

> Guess: Colorado  
> Result: Warm — 2 border crossings away — target is southeast

> Guess: Oklahoma  
> Result: Very hot — 1 border crossing away

> Guess: Texas  
> Correct

#### Scoring

Possible starting system:

- Start: 1,000 points
- Each wrong guess: -75
- Optional clue: -100 to -300 depending on clue strength
- Faster solution = better score

Exact scoring should be tuned after playtesting.

---

### B. Clue Ladder

One mystery state is selected.

The player receives increasingly useful clues and may guess after every clue.

The earlier the correct guess, the higher the score.

Example clue progression:

1. Population range
2. Area rank
3. Economic / industry clue
4. Geographic or historical clue
5. Major cities
6. Capital
7. Bordering states
8. Postal abbreviation
9. State silhouette
10. Approximate position on the U.S. map

The order should vary between puzzles so players cannot memorize the clue sequence.

#### Example scoring

| Clue | Maximum Score |
|---|---:|
| 1 | 1,000 |
| 2 | 900 |
| 3 | 800 |
| 4 | 700 |
| 5 | 600 |
| 6 | 500 |
| 7 | 400 |
| 8 | 300 |
| 9 | 200 |
| 10 | 100 |

Wrong guesses may incur an additional penalty, for example -50 points.

#### Future variation: Choose Your Clue

Instead of revealing clues in a fixed sequence, allow players to purchase a clue category.

Examples:

- Population — 100 points
- Economy — 125 points
- Cities — 150 points
- Borders — 200 points
- Capital — 250 points
- Silhouette — 300 points

This introduces strategy because players can choose clue categories matching their strengths.

---

### C. Border Chain

The player must travel from one state to another by selecting neighboring states.

Example:

> California → ? → ? → ? → New York

The goal is to find a valid route using as few state transitions as possible.

Score can compare the player's path to the mathematically shortest path.

This mode can use graph-search algorithms such as BFS to determine the optimal number of border crossings.

---

## 3. Future Game Modes

### Abbreviation Blitz
Rapid state ↔ postal abbreviation questions.

### Map Blitz
A state name appears and the player taps the correct state on a blank map.

### Shape Hunt
Identify a state from its silhouette.

### Capital Hunt
State ↔ capital challenges.

### Map Conquest
A strategy mode where the player begins with one state and expands into neighboring states by answering geography questions.

Long-term multiplayer possibility:

- Player A controls one color
- Player B controls another
- Correct answers allow territorial expansion
- First to control a target number of states wins

---

## 4. Geographic Expansion

The game engine should be designed so that the data source can eventually be swapped.

Potential expansions:

- U.S. States
- World Countries
- Canadian Provinces
- Indian States
- Australian States / Territories
- Europe
- Africa
- Asia
- South America
- U.S. Cities
- World Capitals

Game modes such as Clue Ladder and Border Hunt should work across most datasets.

---

## 5. MVP — Version 1

The first public version should intentionally remain small.

### MVP game

**U.S. Border Hunt**

### Required features

- Interactive U.S. state map
- All 50 state polygons
- One mystery state
- Search / state guess input
- Guess history
- Border-distance calculation
- Direction feedback
- Hot / cold indicator
- Correct-answer state
- Score
- Restart / practice game
- Daily puzzle
- Mobile-responsive interface
- Shareable text result

### Example share result

```text
MapTrail — Border Hunt #24

🟦 🟨 🟧 🟥 🟩
Solved in 5 guesses
Score: 725
```

Do not reveal the daily answer in shared output.

---

## 6. Version Roadmap

### V0.1 — Prototype

Goal: prove the core mechanic.

Build:

- Basic U.S. SVG map
- State dataset
- Random mystery state
- Guess input
- Highlight guessed states
- Correct / incorrect feedback
- Border graph

No accounts, database, analytics, or fancy animation.

---

### V0.2 — Playable Border Hunt

Add:

- Border distance
- Direction
- Hot / cold scale
- Guess history
- Scoring
- Better mobile UI
- Reset / new practice game

---

### V0.3 — Daily Game

Add:

- One deterministic puzzle per calendar day
- Same state for every player
- Puzzle number
- Daily result
- Share result
- Local streak
- Local statistics

Local browser storage is sufficient initially.

---

### V0.4 — Clue Ladder

Add:

- State clue database
- 8–10 clue categories
- Progressive clue reveal
- Guess penalties
- Scoring
- Daily Clue Ladder
- Practice mode

---

### V0.5 — Border Chain

Add:

- Select start and destination
- Clickable path-building
- Neighbor validation
- Shortest-path calculation
- Optimal-path comparison
- Daily challenge

---

### V1.0 — Public Launch

Required:

- Border Hunt
- Clue Ladder
- Border Chain
- Daily + Practice modes
- Mobile-first UI
- Instructions
- Statistics
- Streaks
- Share cards / share text
- Error handling
- Accessibility pass
- Automated tests
- Deployment

---

## 7. Data Model

Recommended state object:

```ts
type State = {
  id: string;
  name: string;
  abbreviation: string;
  capital: string;
  largestCity?: string;
  population?: number;
  populationYear?: number;
  landAreaSqMi?: number;
  areaRank?: number;
  gdp?: number;
  gdpRank?: number;
  borderingStates: string[];
  region: string;
  timeZones?: string[];
  nationalParks?: string[];
  landmarks?: string[];
  industries?: string[];
  facts?: string[];
};
```

Keep stable geographic data separate from frequently updated statistical data.

Suggested separation:

```text
data/
  states.json
  borders.json
  capitals.json
  demographics.json
  economy.json
  parks.json
  clues.json
```

---

## 8. Data Sources

Use authoritative sources whenever possible.

### Stable geography

- U.S. Census geographic data
- U.S. Geological Survey
- public GeoJSON / TopoJSON state boundary datasets

### Population and cities

- U.S. Census Bureau

### Economy

- U.S. Bureau of Economic Analysis

### National parks

- National Park Service

### Transportation

- U.S. Department of Transportation
- Federal Railroad Administration where appropriate

### Climate

- NOAA

Every time-sensitive clue should store:

- value
- source
- reference year
- date last updated

Avoid vague clues such as:

> “Ranks 46th in economy according to the latest survey.”

Prefer:

> “Ranks 46th in real GDP per capita using BEA 2025 data.”

---

## 9. Clue Ladder Data Design

Each state should have a pool of possible clues.

Example:

```ts
type Clue = {
  id: string;
  stateId: string;
  category:
    | "population"
    | "cities"
    | "economy"
    | "area"
    | "capital"
    | "borders"
    | "industry"
    | "history"
    | "landmark"
    | "parks"
    | "transportation"
    | "abbreviation"
    | "silhouette"
    | "map";
  text: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  source?: string;
  sourceYear?: number;
  updatedAt?: string;
};
```

The clue engine should assemble a ladder that generally moves from difficult to easy.

Do not rely on one fixed ordering.

---

## 10. Border Graph

Represent states as a graph.

Example:

```ts
{
  KY: ["IL", "IN", "OH", "WV", "VA", "TN", "MO"],
  TN: ["KY", "VA", "NC", "GA", "AL", "MS", "AR", "MO"]
}
```

This enables:

- Border Hunt distance
- Border Chain
- Neighbor clues
- Map Conquest
- shortest-path calculations

Use breadth-first search (BFS) for shortest border distance.

### Four Corners rule

For MapTrail, corner contact counts as adjacency. New Mexico–Utah and
Arizona–Colorado are each one crossing apart in both directions, even though
those pairs meet only at a point. Include these edges in the graph so BFS uses
them for all routes, and show this convention in a visible note beneath the map.

---

## 11. Daily Puzzle System

Initially, avoid a backend.

Use the date as a deterministic seed.

Concept:

```text
YYYY-MM-DD → seeded generator → selected state
```

Requirements:

- Every player gets the same state on the same date.
- The solution should not change during the user's local day.
- Historical puzzle numbers should be deterministic.
- Avoid obvious repeating patterns.

Later, daily puzzles can be curated from a database.

---

## 12. Recommended Tech Stack

### Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS

### Geography

- SVG / GeoJSON / TopoJSON
- D3 only where it provides useful map utilities

### State management

For MVP:

- React state
- localStorage for streaks and statistics

Avoid introducing Redux or a database before needed.

### Testing

- Vitest or Jest for game logic
- React Testing Library
- Playwright for critical gameplay flows

### Hosting

The prototype uses GitHub Pages with a Next.js static export. Round selection
runs in the browser, and a GitHub Actions workflow tests, builds, and deploys
pushes to `main`. No application server or database is needed.

Vercel and Cloudflare Pages remain future options if hosting requirements change.

---

## 13. Suggested Repository Structure

```text
maptrail/
├── app/
│   ├── page.tsx
│   ├── border-hunt/
│   ├── clue-ladder/
│   └── border-chain/
├── components/
│   ├── USMap.tsx
│   ├── GuessInput.tsx
│   ├── GuessHistory.tsx
│   ├── ScoreCard.tsx
│   └── ShareResult.tsx
├── data/
│   ├── states.json
│   ├── borders.json
│   └── clues.json
├── lib/
│   ├── borderDistance.ts
│   ├── direction.ts
│   ├── dailyPuzzle.ts
│   ├── scoring.ts
│   └── clueEngine.ts
├── tests/
├── public/
├── PLAN.md
├── README.md
└── package.json
```

---

## 14. UI Direction

Design goal:

**clean map + strong game feedback + minimal clutter**

The map should remain the visual focus.

Suggested desktop layout:

```text
------------------------------------------------
              MapTrail — BORDER HUNT
------------------------------------------------

               [ INTERACTIVE MAP ]

Guess a state
[ Kentucky________________ ] [ GUESS ]

🔥 Warm
2 borders away
Target is southwest

Guesses
1. Ohio
2. Kentucky

Score: 850
------------------------------------------------
```

Mobile:

```text
MapTrail
Border Hunt #24

[ MAP ]

[ Guess a state ]
[ GUESS ]

🔥 Warm
2 borders away

Score 850 | Guess 2
```

---

## 15. Design Rules

- Mobile-first
- Large touch targets
- Never require hover
- Color cannot be the only way feedback is communicated
- Avoid excessive animations
- Map should load quickly
- Game should be playable without an account
- First interaction should be obvious
- Instructions should fit within a short modal / panel

---

## 16. Game Logic Tests

Before polishing visuals, create automated tests for:

### Border graph

- Every state ID exists
- Border relationships are symmetric
- No state borders itself
- BFS returns correct distances
- Neighboring states return distance = 1

### Daily puzzles

- Same date produces same state
- Different dates produce valid states
- Puzzle number remains stable

### Scoring

- Score never becomes NaN
- Score never exceeds defined maximum
- Penalties apply correctly
- Correct solution locks the game

### Clue Ladder

- Only clues belonging to the correct state are shown
- No duplicate clue categories when prohibited
- Abbreviation / silhouette clues occur near the easy end
- Sources are retained for dynamic facts

---

## 17. What NOT to Build Yet

Do not start V1 with:

- User accounts
- Authentication
- Multiplayer
- Chat
- Paid subscriptions
- Complex backend
- Global leaderboards
- Native mobile apps
- AI-generated clues at runtime
- Dozens of game modes

These can become distractions before the game itself is proven fun.

---

## 18. First Development Milestone

A successful first milestone is:

> Open the site, see a U.S. map, guess any state, and receive correct border-distance feedback relative to a randomly selected mystery state.

Nothing else is required for the first milestone.

Acceptance criteria:

1. All 50 states render.
2. A mystery state is selected.
3. User can enter a state by name or abbreviation.
4. Invalid guesses are rejected.
5. Valid guessed state highlights on the map.
6. The game calculates border distance correctly.
7. Correct answer ends the round.
8. Core logic has automated tests.

---

## 19. Initial Git Milestones

Suggested commits:

```text
chore: initialize MapTrail project
feat: add US state dataset
feat: render interactive US map
feat: add state guessing
feat: add state border graph
feat: calculate border distance
feat: add border hunt feedback
test: add game logic tests
feat: add scoring and guess history
feat: add daily puzzle seed
feat: add share results
```

Keep commits small and understandable.

---

## 20. First GitHub Issues

### Issue #1
Set up Next.js + TypeScript + Tailwind project.

### Issue #2
Add normalized U.S. state dataset.

### Issue #3
Render responsive U.S. map.

### Issue #4
Create border adjacency graph.

### Issue #5
Implement BFS border-distance utility.

### Issue #6
Implement state guess input.

### Issue #7
Connect guesses to map feedback.

### Issue #8
Add scoring and guess history.

### Issue #9
Add deterministic daily puzzle.

### Issue #10
Add tests for geographic game logic.

---

## 21. Development Philosophy

Build vertically.

Do not create every database and component first.

Preferred sequence:

```text
Map
↓
Guess
↓
Feedback
↓
Playable round
↓
Scoring
↓
Daily game
↓
Polish
↓
Second game mode
```

At every stage, the application should remain runnable.

---

## 22. Definition of MVP Success

The MVP succeeds if a new player can:

1. Open the link.
2. Understand the objective quickly.
3. Make a guess.
4. Understand whether they are getting closer.
5. Solve the puzzle.
6. See their score.
7. Share a spoiler-free result.
8. Want to play tomorrow.

That is more important than the number of features.

---

## 23. Long-Term Vision

MapTrail can eventually become a small collection of geography games:

- Border Hunt
- Clue Ladder
- Border Chain
- Map Blitz
- Shape Hunt
- Capital Hunt
- Map Conquest

All modes should share:

- geographic datasets
- map engine
- scoring infrastructure
- daily puzzle system
- player statistics
- sharing system

The long-term goal is not simply to quiz geography knowledge.

It is to make **learning the map itself feel like a daily game**.
