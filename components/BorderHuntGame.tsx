"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { EuropeMap } from "@/components/EuropeMap";
import { GameNavigation } from "@/components/GameNavigation";
import { OnboardingCard } from "@/components/OnboardingCard";
import { RegionSelector } from "@/components/RegionSelector";
import { USMap } from "@/components/USMap";
import { EUROPE_COUNTRIES_DATASET, isEuropeCountryCode } from "@/data/geography/europe/countries";
import { EUROPE_TARGET_COUNTRY_CODES, type EuropeCountryCode } from "@/data/geography/europe/borders";
import { type PlayableBorderHuntRegion } from "@/data/geography/regions";
import { US_STATES_DATASET } from "@/data/geography/us-states";
import { isStateCode, type StateCode } from "@/data/states";
import { findGeographyPlace, pickMysteryPlace } from "@/lib/border-hunt/engine";
import { analytics, type AnalyticsRegion } from "@/lib/analytics";
import { DIFFICULTIES, getDifficultyDescription, type Difficulty } from "@/lib/difficulty";
import {
  createConnectionGraph,
  shortestConnectionDistance,
  shortestConnectionPath,
} from "@/lib/geography/connection";
import { getGeographicDirection, type CardinalDirection } from "@/lib/geography/direction";
import type { GeographyDataset } from "@/lib/geography/types";
import {
  getDistanceFeedback,
  LAND_DISTANCE_LEGEND,
  MYSTERY_STATE_CODES,
  pickMysteryState,
  type DistanceFeedback,
} from "@/lib/game";
import {
  EUROPE_BORDER_HUNT_ONBOARDING,
  hasSeenOnboarding,
  markOnboardingSeen,
} from "@/lib/onboarding";

type GuessResult = {
  code: string;
  name: string;
  distance: number | null;
  feedback: DistanceFeedback;
};

const EUROPE_ONBOARDING_KEY = "maptrail:onboarding:border-hunt:europe:v1";
const DIRECTION_ARROWS: Record<CardinalDirection, string> = {
  N: "↑", NE: "↗", E: "→", SE: "↘", S: "↓", SW: "↙", W: "←", NW: "↖",
};

function chooseNewMystery(previous: string, targetIds: readonly string[]) {
  let next = pickMysteryPlace(targetIds);
  while (targetIds.length > 1 && next === previous) next = pickMysteryPlace(targetIds);
  return next;
}

function getAnalyticsRegion(region: PlayableBorderHuntRegion): AnalyticsRegion {
  return region === "europe" ? "europe" : "us";
}

function elapsedSeconds(startedAt: number | null) {
  return startedAt === null ? 0 : Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

export function BorderHuntGame() {
  const [region, setRegion] = useState<PlayableBorderHuntRegion>("us-states");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mysteryId, setMysteryId] = useState<string>(pickMysteryState);
  const [guessInput, setGuessInput] = useState("");
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasEnteredGame, setHasEnteredGame] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const roundStartedAtRef = useRef<number | null>(null);
  const restoredRoundTrackedRef = useRef(false);
  const submittedGuessIdsRef = useRef(new Set<string>());
  const roundCompletedRef = useRef(false);

  const isEurope = region === "europe";
  const dataset = (isEurope ? EUROPE_COUNTRIES_DATASET : US_STATES_DATASET) as GeographyDataset<string>;
  const targetIds: readonly string[] = isEurope ? EUROPE_TARGET_COUNTRY_CODES : MYSTERY_STATE_CODES;
  const placeKind = dataset.placeKind;
  const placeLabel = placeKind === "state" ? "state" : "country";
  const mysteryInfo = dataset.places.find((place) => place.id === mysteryId);
  const latestGuess = guesses.at(-1) ?? null;
  const graph = createConnectionGraph(dataset);

  const direction = isEurope && difficulty === "easy" && latestGuess && latestGuess.distance !== 0
    ? (() => {
        const from = dataset.places.find((place) => place.id === latestGuess.code)?.labelPoint;
        const to = mysteryInfo?.labelPoint;
        return from && to ? getGeographicDirection(from, to) : null;
      })()
    : null;

  const europeWinRoute = isEurope && isComplete
    ? (() => {
        const routeStart = guesses
          .filter((guess) => guess.distance !== null && guess.distance > 0)
          .sort((left, right) => (left.distance ?? 0) - (right.distance ?? 0))[0]?.code ?? mysteryId;
        const route = shortestConnectionPath(routeStart, mysteryId, graph) ?? [mysteryId];
        return route.map((code) => dataset.places.find((place) => place.id === code)?.name ?? code);
      })()
    : null;

  const usGuesses = guesses.flatMap((guess) =>
    isStateCode(guess.code) ? [{ code: guess.code, distance: guess.distance }] : [],
  );
  const europeGuesses = guesses.flatMap((guess) =>
    isEuropeCountryCode(guess.code) ? [{ code: guess.code, distance: guess.distance }] : [],
  );

  useEffect(() => {
    if (hasSeenOnboarding("border-hunt", window.localStorage)) {
      const restoreTimer = window.setTimeout(() => {
        if (!restoredRoundTrackedRef.current) {
          restoredRoundTrackedRef.current = true;
          roundStartedAtRef.current = Date.now();
          analytics.gameStarted({
            game_mode: "border_hunt",
            region: "us",
            difficulty: "easy",
            easy_mode: true,
          });
        }
        setHasEnteredGame(true);
        setIsIntroOpen(false);
      }, 0);
      return () => window.clearTimeout(restoreTimer);
    }
  }, []);

  function resetRound(nextMystery: string) {
    setMysteryId(nextMystery);
    setGuessInput("");
    setGuesses([]);
    setError(null);
    setIsComplete(false);
    roundStartedAtRef.current = null;
    submittedGuessIdsRef.current = new Set();
    roundCompletedRef.current = false;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function startNewRound(nextDifficulty = difficulty) {
    resetRound(chooseNewMystery(mysteryId, targetIds));
    roundStartedAtRef.current = Date.now();
    analytics.gameStarted({
      game_mode: "border_hunt",
      region: getAnalyticsRegion(region),
      difficulty: nextDifficulty,
      easy_mode: nextDifficulty === "easy",
    });
  }

  function playAgain() {
    analytics.playAgainClicked({
      game_mode: "border_hunt",
      region: getAnalyticsRegion(region),
    });
    startNewRound();
  }

  function changeRegion(nextRegion: PlayableBorderHuntRegion) {
    if (nextRegion === region) return;
    if (guesses.length > 0 && !window.confirm("Switch maps and start a new trail?")) return;

    const nextTargets = nextRegion === "europe" ? EUROPE_TARGET_COUNTRY_CODES : MYSTERY_STATE_CODES;
    setRegion(nextRegion);
    resetRound(pickMysteryPlace(nextTargets));

    const hasSeenIntro = nextRegion === "us-states"
      ? hasSeenOnboarding("border-hunt", window.localStorage)
      : window.localStorage.getItem(EUROPE_ONBOARDING_KEY) === "seen";
    if (hasSeenIntro) {
      roundStartedAtRef.current = Date.now();
      analytics.gameStarted({
        game_mode: "border_hunt",
        region: getAnalyticsRegion(nextRegion),
        difficulty,
        easy_mode: difficulty === "easy",
      });
    }
    setHasEnteredGame(hasSeenIntro);
    setIsIntroOpen(!hasSeenIntro);
  }

  function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isComplete || roundCompletedRef.current) return;
    setError(null);

    const guessedPlace = findGeographyPlace(dataset, guessInput);
    if (!guessedPlace) {
      setError(placeKind === "state"
        ? "That isn't a U.S. state. Try a full name or postal abbreviation."
        : "That isn't in the Europe beta roster. Try a country name or code.");
      return;
    }
    if (
      submittedGuessIdsRef.current.has(guessedPlace.id) ||
      guesses.some((guess) => guess.code === guessedPlace.id)
    ) {
      setError(`You already guessed ${guessedPlace.name}. Try another trail.`);
      return;
    }
    submittedGuessIdsRef.current.add(guessedPlace.id);

    const distance = shortestConnectionDistance(guessedPlace.id, mysteryId, graph);
    const result: GuessResult = {
      code: guessedPlace.id,
      name: guessedPlace.name,
      distance,
      feedback: getDistanceFeedback(distance, placeKind),
    };
    const guessNumber = guesses.length + 1;
    const analyticsRegion = getAnalyticsRegion(region);
    analytics.guessSubmitted({
      game_mode: "border_hunt",
      region: analyticsRegion,
      guess_number: guessNumber,
      is_correct: distance === 0,
      border_distance: distance,
      proximity: result.feedback.level,
    });
    setGuesses((current) => [...current, result]);
    setGuessInput("");

    if (distance === 0) {
      roundCompletedRef.current = true;
      setIsComplete(true);
      analytics.gameCompleted({
        game_mode: "border_hunt",
        region: analyticsRegion,
        won: true,
        guess_count: guessNumber,
        duration_seconds: elapsedSeconds(roundStartedAtRef.current),
        difficulty,
        easy_mode: difficulty === "easy",
        target_name: mysteryInfo?.name ?? mysteryId,
      });
    } else inputRef.current?.focus();
  }

  function selectMapPlace(code: string) {
    if (difficulty !== "easy" || isComplete) return;
    setGuessInput(dataset.places.find((place) => place.id === code)?.name ?? code);
    setError(null);
    inputRef.current?.focus();
  }

  function enterGame() {
    if (isEurope) window.localStorage.setItem(EUROPE_ONBOARDING_KEY, "seen");
    else markOnboardingSeen("border-hunt", window.localStorage);
    setHasEnteredGame(true);
    setIsIntroOpen(false);
    if (roundStartedAtRef.current === null) {
      roundStartedAtRef.current = Date.now();
      analytics.gameStarted({
        game_mode: "border_hunt",
        region: getAnalyticsRegion(region),
        difficulty,
        easy_mode: difficulty === "easy",
      });
    }
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <main className="min-h-screen overflow-hidden px-4 pb-10 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="topographic-lines" />

      <header className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] py-4 sm:py-5">
        <a className="group flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--trail)]" href="#game">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>
            <span className="block font-display text-lg font-black tracking-[-0.04em]">MapTrail</span>
            <span className="block text-[0.62rem] font-bold tracking-[0.22em] text-[var(--forest)] uppercase">Follow the borders</span>
          </span>
        </a>
        <GameNavigation
          activeMode="border-hunt"
          hasProgress={guesses.length > 0 && !isComplete}
          region={getAnalyticsRegion(region)}
        />
      </header>

      <section className="relative mx-auto max-w-7xl pb-5 pt-7 sm:pb-8 sm:pt-10">
        <p className="eyebrow">Border Hunt · {isEurope ? "Europe Beta" : "U.S. States"}</p>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <h1 className="max-w-4xl font-display text-[clamp(2.5rem,7vw,5.6rem)] leading-[0.91] font-black tracking-[-0.07em] text-balance">
            Find the {placeLabel}.<span className="block text-[var(--trail)]">Count the borders.</span>
          </h1>
          <div className="max-w-md">
            <p className="text-sm leading-6 font-semibold text-[color:var(--ink-soft)] sm:text-base">
              Guess any {placeLabel}. Each result reveals the fewest land borders you’d cross to reach this round’s mystery {placeLabel}.
            </p>
            <button
              className="how-to-play"
              onClick={() => {
                analytics.instructionsOpened({
                  game_mode: "border_hunt",
                  region: getAnalyticsRegion(region),
                });
                setIsIntroOpen(true);
              }}
              type="button"
            >
              How to play
            </button>
          </div>
        </div>
        <RegionSelector onChange={changeRegion} value={region} />
      </section>

      {isIntroOpen ? (
        <div className="relative mx-auto mb-5 max-w-7xl">
          <OnboardingCard
            content={isEurope ? EUROPE_BORDER_HUNT_ONBOARDING : undefined}
            mode="border-hunt"
            onClose={hasEnteredGame ? () => setIsIntroOpen(false) : undefined}
            onStart={enterGame}
          />
        </div>
      ) : null}

      {hasEnteredGame ? (
        <>
          <fieldset className="relative mx-auto mb-5 max-w-7xl rounded-xl border border-[var(--line)] bg-white/45 p-4">
            <legend className="px-2 text-xs font-extrabold tracking-widest text-[var(--forest)] uppercase">Difficulty</legend>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((mode) => (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] px-4 py-2 font-bold has-checked:bg-[var(--forest)] has-checked:text-white" key={mode}>
                  <input
                    aria-describedby="difficulty-description"
                    checked={difficulty === mode}
                    name="difficulty"
                    onChange={() => { setDifficulty(mode); startNewRound(mode); }}
                    type="radio"
                    value={mode}
                  />
                  {DIFFICULTIES[mode].label}
                </label>
              ))}
            </div>
            <p aria-live="polite" className="mt-3 text-sm text-[color:var(--ink-soft)]" id="difficulty-description">
              {getDifficultyDescription(difficulty, placeKind)} Changing difficulty starts a new trail.
            </p>
          </fieldset>

          <section className="relative mx-auto grid max-w-7xl gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.7fr)] lg:gap-5" id="game">
            <div className="map-card order-1">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-3 sm:px-6">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.14em] text-[var(--forest)] uppercase">The trail map</p>
                  <p className="mt-0.5 text-sm font-semibold text-[color:var(--ink-soft)]">
                    {difficulty === "easy" ? `Tap a ${placeLabel} or type a name below` : difficulty === "intermediate" ? "Read the shapes, then type your guess" : "Your guesses build the map"}
                  </p>
                </div>
                <span className="map-key"><i aria-hidden="true" /> Guessed</span>
              </div>

              <div className="map-stage px-2 py-4 sm:px-6 sm:py-7">
                {isEurope ? (
                  <EuropeMap
                    difficulty={difficulty}
                    disabled={isComplete}
                    guesses={europeGuesses}
                    onSelectCountry={(code: EuropeCountryCode) => selectMapPlace(code)}
                    revealedCountry={isComplete && isEuropeCountryCode(mysteryId) ? mysteryId : null}
                  />
                ) : (
                  <USMap
                    difficulty={difficulty}
                    disabled={isComplete}
                    guesses={usGuesses}
                    onSelectState={(code: StateCode) => selectMapPlace(code)}
                    revealedState={isComplete && isStateCode(mysteryId) ? mysteryId : null}
                  />
                )}
                {difficulty === "hard" && guesses.length === 0 ? (
                  <p className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center font-semibold text-[color:var(--ink-soft)]">
                    Uncharted territory. Type your first guess to reveal a {placeLabel}.
                  </p>
                ) : null}
              </div>

              <div aria-label="Border distance legend" className="heat-legend border-t border-[var(--line)] px-4 py-3 sm:px-6">
                {LAND_DISTANCE_LEGEND.map((item) => (
                  <span className={`legend legend--${item.level}`} key={item.level}><span aria-hidden="true">{item.icon}</span> {item.label}</span>
                ))}
              </div>
              <p className="border-t border-[var(--line)] px-4 py-3 text-xs leading-5 text-[color:var(--ink-soft)] sm:px-6">
                {isEurope ? (
                  <>
                    <strong className="font-extrabold text-[var(--forest)]">Beta land rules:</strong>{" "}
                    Reviewed terrestrial borders only. No ferry links or invented gateways.
                    <span className="mt-1 block">Made with Natural Earth · Admin 0 Countries 1:10m v5.1.1</span>
                  </>
                ) : (
                  <><strong className="font-extrabold text-[var(--forest)]">Four Corners counts:</strong>{" "}New Mexico–Utah and Arizona–Colorado are each 1 crossing apart.</>
                )}
              </p>
            </div>

            <aside aria-label="Border Hunt controls" className="game-card order-2">
              <div className="game-card__topline"><span>Round status</span><strong>{isComplete ? "Complete" : `${guesses.length} guessed`}</strong></div>
              <div className="flex flex-col px-5 pb-5 pt-6 sm:px-6">
                <div aria-atomic="true" aria-live="polite" className="order-2 mt-3 min-h-32">
                  {isComplete ? (
                    <div className="success-panel">
                      <p className="feedback-kicker">Destination reached</p>
                      <h2>{mysteryInfo?.name}</h2>
                      <p>Trail found in {guesses.length} guess{guesses.length === 1 ? "" : "es"}.</p>
                      {europeWinRoute ? (
                        <p className="mt-3 text-sm leading-6">
                          <strong>Shortest reviewed route:</strong>{" "}
                          {europeWinRoute.join(" → ")}
                        </p>
                      ) : null}
                    </div>
                  ) : latestGuess ? (
                    <div className={`feedback-panel feedback-panel--${latestGuess.feedback.level}`}>
                      <div aria-hidden="true" className="feedback-panel__pin" />
                      <div>
                        <p className="feedback-kicker">{latestGuess.name}</p>
                        <h2><span aria-hidden="true">{latestGuess.feedback.icon} </span>{latestGuess.feedback.label}</h2>
                        <p>{latestGuess.feedback.detail}</p>
                        {direction ? (
                          <p className="direction-guidance"><span aria-hidden="true">{DIRECTION_ARROWS[direction.short]}</span> Head {direction.name} toward the mystery country.</p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="welcome-panel">
                      <span className="welcome-panel__number">01</span>
                      <div><h2>Choose a starting point</h2><p>Use a full {placeLabel} name or its abbreviation.</p></div>
                    </div>
                  )}
                </div>

                <form className="order-1" onSubmit={submitGuess}>
                  <label className="mb-2 block text-xs font-extrabold tracking-[0.12em] text-[var(--forest)] uppercase" htmlFor={isEurope ? "country-guess" : "state-guess"}>Guess a {placeLabel}</label>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                    <input
                      aria-describedby={error ? "guess-error" : undefined}
                      aria-invalid={Boolean(error)}
                      autoComplete="off"
                      className="guess-input min-w-0 flex-1"
                      disabled={isComplete}
                      id={isEurope ? "country-guess" : "state-guess"}
                      list={isEurope ? "country-options" : "state-options"}
                      onChange={(event) => setGuessInput(event.target.value)}
                      placeholder={isEurope ? "e.g. France or FRA" : "e.g. Kentucky or KY"}
                      ref={inputRef}
                      type="text"
                      value={guessInput}
                    />
                    <datalist id={isEurope ? "country-options" : "state-options"}>
                      {dataset.places.map((place) => <option key={place.id} value={place.name}>{place.aliases[0]}</option>)}
                    </datalist>
                    <button className="primary-button" disabled={isComplete || guessInput.trim().length === 0} type="submit">Check trail</button>
                  </div>
                  <p className="mt-2 min-h-5 text-sm font-bold text-[var(--danger)]" id="guess-error" role={error ? "alert" : undefined}>{error}</p>
                </form>
                {isComplete ? <button className="secondary-button order-3 mt-4 w-full" onClick={playAgain} type="button">Start a new trail</button> : null}
              </div>

              <div className="border-t border-[var(--line)] px-5 py-5 sm:px-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-extrabold tracking-[0.12em] text-[var(--forest)] uppercase">Trail log</h2>
                  <span className="text-xs font-bold text-[color:var(--ink-soft)]">{guesses.length}/{dataset.places.length}</span>
                </div>
                {guesses.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--line)] px-4 py-5 text-center text-sm font-semibold text-[color:var(--ink-soft)]">Your guesses will appear here.</p>
                ) : (
                  <ol className="guess-list">
                    {[...guesses].reverse().map((guess, reverseIndex) => (
                      <li key={guess.code}>
                        <span className="guess-list__number">{guesses.length - reverseIndex}</span>
                        <span className="min-w-0 flex-1">
                          <strong>{guess.name}</strong>
                          <small><strong className="guess-list__feedback"><span aria-hidden="true">{guess.feedback.icon} </span>{guess.feedback.label}</strong>{" "}· {guess.feedback.detail}</small>
                        </span>
                        <span aria-label={guess.feedback.label} className={`guess-list__dot guess-list__dot--${guess.feedback.level}`} title={guess.feedback.label} />
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </aside>
          </section>
        </>
      ) : null}

      <footer className="relative mx-auto mt-5 flex max-w-7xl flex-col gap-2 border-t border-[var(--line)] pt-4 text-xs font-semibold text-[color:var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
        {isEurope ? (
          <><p>Land borders only · 40 connected beta targets · 44 roster countries</p><p>Made with Natural Earth · Admin 0 Countries 1:10m v5.1.1</p></>
        ) : (
          <><p>Land borders + Four Corners · Practice targets use the connected 48 states</p><p>Map boundaries: U.S. Census Bureau via us-atlas</p></>
        )}
      </footer>
    </main>
  );
}
