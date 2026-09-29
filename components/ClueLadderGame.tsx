"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { GameNavigation } from "@/components/GameNavigation";
import {
  ClueLadderMapHints,
  type MapHintId,
} from "@/components/ClueLadderMapHints";
import { OnboardingCard } from "@/components/OnboardingCard";
import { findState, formatStateOption, STATES } from "@/data/states";
import {
  analytics,
  type AnalyticsMapCategory,
} from "@/lib/analytics";
import {
  availableScore,
  choosePuzzle,
  hasRevealedMapHint,
  MAP_HINT_PENALTY,
  newRound,
  play,
  type PlayablePuzzle,
} from "@/lib/clue-ladder/play";
import type { ClueLadderHintData } from "@/lib/clue-ladder/hint-types";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/onboarding";

const MAP_HINT_CATEGORIES: Record<MapHintId, AnalyticsMapCategory> = {
  general: "map_position",
  "time-zones": "time_zone",
  parks: "parks",
};

function elapsedSeconds(startedAt: number | null) {
  return startedAt === null ? 0 : Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

function trackClueRevealed(puzzle: PlayablePuzzle, rung: number) {
  analytics.clueRevealed({
    game_mode: "clue_ladder",
    region: "us",
    clue_number: rung + 1,
    clue_category: puzzle.clues[rung].category,
  });
}

export function ClueLadderGame({
  puzzles,
  hints,
}: {
  puzzles: PlayablePuzzle[];
  hints: ClueLadderHintData;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [round, setRound] = useState(newRound);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [hasEnteredGame, setHasEnteredGame] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(true);
  const [revealedMapHints, setRevealedMapHints] = useState<MapHintId[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const roundStartedAtRef = useRef<number | null>(null);
  const restoredRoundTrackedRef = useRef(false);
  const submittedGuessCodesRef = useRef(new Set<string>());
  const lastHandledRungRef = useRef<number | null>(null);
  const roundCompletedRef = useRef(false);
  const puzzle = index === null ? null : puzzles[index];
  const finished = round.status !== "playing";
  const mapPenalty = revealedMapHints.length * MAP_HINT_PENALTY;
  const generalMapRevealed = revealedMapHints.includes("general");

  useEffect(() => {
    if (hasSeenOnboarding("clue-ladder", window.localStorage)) {
      const restoreTimer = window.setTimeout(() => {
        const nextIndex = choosePuzzle(puzzles.length, null, Math.random());
        if (!restoredRoundTrackedRef.current) {
          restoredRoundTrackedRef.current = true;
          roundStartedAtRef.current = Date.now();
          analytics.gameStarted({ game_mode: "clue_ladder", region: "us" });
          trackClueRevealed(puzzles[nextIndex], 0);
        }
        setHasEnteredGame(true);
        setIsIntroOpen(false);
        setIndex(nextIndex);
      }, 0);
      return () => window.clearTimeout(restoreTimer);
    }
  }, [puzzles.length]);

  function start() {
    const nextIndex = choosePuzzle(puzzles.length, index, Math.random());
    if (finished && puzzle) {
      analytics.playAgainClicked({ game_mode: "clue_ladder", region: "us" });
    }
    markOnboardingSeen("clue-ladder", window.localStorage);
    setHasEnteredGame(true);
    setIsIntroOpen(false);
    setIndex(nextIndex);
    setRound(newRound());
    setRevealedMapHints([]);
    setInput("");
    setMessage("");
    submittedGuessCodesRef.current = new Set();
    lastHandledRungRef.current = null;
    roundCompletedRef.current = false;
    roundStartedAtRef.current = Date.now();
    analytics.gameStarted({ game_mode: "clue_ladder", region: "us" });
    trackClueRevealed(puzzles[nextIndex], 0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!puzzle || finished) return;

    const state = findState(input);
    if (!state) {
      setMessage("Enter a U.S. state name or its two-letter abbreviation.");
      return;
    }
    if (
      submittedGuessCodesRef.current.has(state.code) ||
      round.guesses.includes(state.code)
    ) {
      setMessage(`You already tried ${state.name}. Try another state.`);
      return;
    }
    if (lastHandledRungRef.current === round.rung) return;
    submittedGuessCodesRef.current.add(state.code);
    lastHandledRungRef.current = round.rung;

    const next = play(puzzle, round, state.code, mapPenalty);
    analytics.guessSubmitted({
      game_mode: "clue_ladder",
      region: "us",
      guess_number: round.guesses.length + 1,
      clues_revealed: round.rung + 1,
      is_correct: next.status === "won",
    });
    if (next.rung > round.rung) trackClueRevealed(puzzle, next.rung);
    if (next.status !== "playing" && !roundCompletedRef.current) {
      roundCompletedRef.current = true;
      analytics.gameCompleted({
        game_mode: "clue_ladder",
        region: "us",
        won: next.status === "won",
        guess_count: next.guesses.length,
        clues_revealed: next.rung + 1,
        duration_seconds: elapsedSeconds(roundStartedAtRef.current),
      });
    }
    setRound(next);
    setInput("");
    setMessage(
      next.status === "won"
        ? "Correct!"
        : `${state.name} is not the answer.${
            next.status === "playing" ? " Here is your next clue." : ""
          }`,
    );
    inputRef.current?.focus();
  }

  function revealMapHint(hint: MapHintId) {
    if (!puzzle || finished || revealedMapHints.includes(hint)) return;
    if (hint !== "general" && !generalMapRevealed) return;
    if (hint === "time-zones" && !hasRevealedMapHint(puzzle, round.rung, "time-zones")) return;
    if (hint === "parks" && !hasRevealedMapHint(puzzle, round.rung, "parks")) return;

    setRevealedMapHints(current => current.includes(hint) ? current : [...current, hint]);
    analytics.mapClueViewed({
      game_mode: "clue_ladder",
      region: "us",
      map_category: MAP_HINT_CATEGORIES[hint],
    });
    const label = hint === "general" ? "Labeled states" : hint === "time-zones" ? "Time zones" : "National Parks";
    setMessage(`${label} layer unlocked. ${MAP_HINT_PENALTY} points deducted.`);
  }

  function revealNextClue() {
    if (!puzzle || finished || lastHandledRungRef.current === round.rung) return;
    lastHandledRungRef.current = round.rung;
    const next = play(puzzle, round);
    if (next.rung > round.rung) trackClueRevealed(puzzle, next.rung);
    if (next.status !== "playing" && !roundCompletedRef.current) {
      roundCompletedRef.current = true;
      analytics.gameCompleted({
        game_mode: "clue_ladder",
        region: "us",
        won: false,
        guess_count: next.guesses.length,
        clues_revealed: next.rung + 1,
        duration_seconds: elapsedSeconds(roundStartedAtRef.current),
      });
    }
    setRound(next);
    setInput("");
    setMessage(round.rung === 6 ? "No guesses left." : "Next clue revealed.");
    inputRef.current?.focus();
  }

  const button =
    "rounded-xl bg-[var(--forest)] px-5 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50";
  const hasProgress = Boolean(
    puzzle && !finished && (round.rung > 0 || round.guesses.length > 0 || revealedMapHints.length > 0),
  );

  return (
    <main className="min-h-screen px-4 pb-12 sm:px-6">
      <div aria-hidden="true" className="topographic-lines" />
      <div className="relative mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] py-5">
          <a className="font-display text-xl font-black tracking-tight" href="#game">
            MapTrail
          </a>
          <GameNavigation activeMode="clue-ladder" hasProgress={hasProgress} region="us" />
        </header>

        <section className="py-8 sm:py-12">
          <p className="eyebrow">Clue Ladder · U.S. States</p>
          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">
              Seven clues.
              <br />
              <span className="text-[var(--trail-dark)]">One mystery state.</span>
            </h1>
            <div className="max-w-md">
              <p className="leading-7 text-[var(--ink-soft)]">
                Guess early to score more. A wrong guess or a skip reveals the next
                clue. You have one guess per clue.
              </p>
              <button
                className="how-to-play"
                onClick={() => {
                  analytics.instructionsOpened({
                    game_mode: "clue_ladder",
                    region: "us",
                  });
                  setIsIntroOpen(true);
                }}
                type="button"
              >
                How to play
              </button>
            </div>
          </div>
        </section>

        {isIntroOpen ? (
          <div className="mb-6">
            <OnboardingCard
              mode="clue-ladder"
              onClose={hasEnteredGame ? () => setIsIntroOpen(false) : undefined}
              onStart={start}
            />
          </div>
        ) : null}

        {hasEnteredGame && puzzle ? (
          <div id="game">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 font-bold">
              <span>Clue {round.rung + 1} of {puzzle.clues.length}</span>
              <span className="text-right">
                {finished
                  ? `Score: ${round.score}`
                  : `${availableScore(puzzle, round, mapPenalty)} points available`}
                {mapPenalty > 0 ? (
                  <small className="block text-xs text-[var(--trail-dark)]">
                    Map reveals: −{mapPenalty}
                  </small>
                ) : null}
              </span>
            </div>
            <div className="mb-6 flex gap-2" aria-hidden="true">
              {puzzle.clues.map((_, clueIndex) => (
                <span
                  className={`h-2 flex-1 rounded-full ${clueIndex <= round.rung ? "bg-[var(--forest)]" : "bg-[var(--line)]"}`}
                  key={clueIndex}
                />
              ))}
            </div>
            <section aria-label="Current clue" className="rounded-3xl border border-[var(--line)] bg-white/80 p-6 shadow-sm sm:p-8">
              <p className="text-2xl leading-relaxed font-bold">{puzzle.clues[round.rung].text}</p>
              {puzzle.clues[round.rung].image ? (
                // Audited inline SVG; no image optimization or network request needed.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={finished ? `${puzzle.name} shape` : "Mystery state shape"}
                  className="mx-auto mt-5 h-56 w-full object-contain"
                  src={puzzle.clues[round.rung].image}
                />
              ) : null}
            </section>
            <ClueLadderMapHints
              disabled={finished}
              generalRevealed={generalMapRevealed}
              hints={hints}
              onReveal={revealMapHint}
              parks={{
                availableThisRound: puzzle.clues.some(clue => clue.mapHintTopics.includes("parks")),
                clueRevealed: hasRevealedMapHint(puzzle, round.rung, "parks"),
                revealed: revealedMapHints.includes("parks"),
              }}
              timeZones={{
                availableThisRound: puzzle.clues.some(clue => clue.mapHintTopics.includes("time-zones")),
                clueRevealed: hasRevealedMapHint(puzzle, round.rung, "time-zones"),
                revealed: revealedMapHints.includes("time-zones"),
              }}
            />
            <p aria-live="polite" className="my-4 min-h-6 font-semibold" role="status">{message}</p>
            {finished ? (
              <section aria-label="Result" className="rounded-2xl bg-[var(--mist)] p-6">
                <h2 className="text-2xl font-black">
                  {round.status === "won" ? "You found " : "The answer was "}{puzzle.name}.
                </h2>
                <p className="my-3">
                  {round.status === "won" ? `Solved on clue ${round.rung + 1}. ` : "All seven clues revealed. "}
                  Score: {round.score}
                </p>
                <button className={button} onClick={start} type="button">Play another state</button>
              </section>
            ) : (
              <form onSubmit={submit}>
                <label className="mb-2 block font-bold" htmlFor="ladder-guess">Which state is it?</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-[var(--forest)] bg-white p-3" id="ladder-guess" list="ladder-states" onChange={(event) => setInput(event.target.value)} placeholder="State name or abbreviation" ref={inputRef} value={input} />
                  <button className={button} type="submit">Guess state</button>
                </div>
                <datalist id="ladder-states">
                  {STATES.map((state) => <option key={state.code} label={formatStateOption(state)} value={state.name} />)}
                </datalist>
                <button
                  className="mt-4 rounded-lg px-1 py-3 font-bold underline underline-offset-4"
                  onClick={revealNextClue}
                  type="button"
                >
                  {round.rung === 6 ? "Reveal answer" : "Skip to next clue"}
                </button>
              </form>
            )}
            {round.rung > 0 ? (
              <details className="mt-6 rounded-xl border border-[var(--line)] p-4">
                <summary className="cursor-pointer font-bold">Earlier clues ({round.rung})</summary>
                <ol className="mt-4 list-decimal space-y-3 pl-5">
                  {puzzle.clues.slice(0, round.rung).map((clue, clueIndex) => <li key={clueIndex}>{clue.text}</li>)}
                </ol>
              </details>
            ) : null}
            {round.guesses.length > 0 ? (
              <p className="mt-5 text-sm">Your guesses: {round.guesses.map((code) => findState(code)!.name).join(" · ")}</p>
            ) : null}
          </div>
        ) : null}

        <footer className="mt-10 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--ink-soft)]">
          Practice preview · {puzzles.length} researched states · 1,000 starting points; each new clue costs 100, each map layer unlock costs {MAP_HINT_PENALTY}, and each wrong guess costs another 50.
        </footer>
      </div>
    </main>
  );
}
