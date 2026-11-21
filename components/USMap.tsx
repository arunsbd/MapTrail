"use client";

import { useState } from "react";
import { US_MAP_VIEWBOX, US_STATE_SHAPES } from "@/data/map";
import type { StateCode } from "@/data/states";
import { formatFeedbackText, getDistanceFeedback } from "@/lib/game";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";

type MapGuess = {
  code: StateCode;
  distance: number | null;
};

type USMapProps = {
  difficulty: Difficulty;
  guesses: readonly MapGuess[];
  revealedState: StateCode | null;
  onSelectState?: (code: StateCode) => void;
  disabled: boolean;
  showStateLabels?: boolean;
  title?: string;
  description?: string;
};

export function USMap({
  difficulty,
  guesses,
  revealedState,
  onSelectState,
  disabled,
  showStateLabels = false,
  title = "United States Border Hunt map",
  description,
}: USMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const guessByState = new Map(guesses.map((guess) => [guess.code, guess]));
  const canSelect = difficulty === "easy" && !disabled && Boolean(onSelectState);
  const [mapX, mapY, mapWidth, mapHeight] = US_MAP_VIEWBOX.split(" ").map(Number);
  const centerX = mapX + mapWidth / 2;
  const centerY = mapY + mapHeight / 2;

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className="us-map">
      <div aria-label="U.S. map controls" className="map-controls" role="group">
        <button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(value + 0.25, 2))} type="button">+</button>
        <button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(value - 0.25, 1))} type="button">−</button>
        <button aria-label="Pan west" onClick={() => setPan((value) => ({ ...value, x: value.x + 55 }))} type="button">←</button>
        <button aria-label="Pan north" onClick={() => setPan((value) => ({ ...value, y: value.y + 45 }))} type="button">↑</button>
        <button aria-label="Pan south" onClick={() => setPan((value) => ({ ...value, y: value.y - 45 }))} type="button">↓</button>
        <button aria-label="Pan east" onClick={() => setPan((value) => ({ ...value, x: value.x - 55 }))} type="button">→</button>
        <button onClick={resetView} type="button">Reset</button>
      </div>
      <svg
        aria-labelledby="us-map-title us-map-description"
        className="us-map__svg h-auto w-full overflow-visible"
        role="group"
        viewBox={US_MAP_VIEWBOX}
      >
        <title id="us-map-title">{title}</title>
        <desc id="us-map-description">
          {description ?? `${DIFFICULTIES[difficulty].description} Guessed states are colored by their border distance from the mystery state.`}
        </desc>

        <g transform={`translate(${centerX + pan.x} ${centerY + pan.y}) scale(${zoom}) translate(${-centerX} ${-centerY})`}>
          {US_STATE_SHAPES.map(({ code, name, path }) => {
            const guess = guessByState.get(code);
            if (difficulty === "hard" && !guess) return null;
            const showName = difficulty === "easy" || Boolean(guess);
            const level = guess
              ? getDistanceFeedback(guess.distance).level
              : revealedState === code
                ? "correct"
                : "unexplored";
            const feedback = guess ? getDistanceFeedback(guess.distance) : null;
            const description = feedback
              ? formatFeedbackText(feedback)
              : revealedState === code
                ? "Mystery state"
                : "Not guessed";

            return (
              <path
                aria-disabled={!canSelect}
                aria-label={showName ? `${name}: ${description}` : undefined}
                aria-hidden={!showName || undefined}
                className={`state-shape state-shape--${level}`}
                d={path}
                data-state={code}
                key={code}
                onClick={() => {
                  if (canSelect) onSelectState?.(code);
                }}
                onKeyDown={(event) => {
                  if (canSelect && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onSelectState?.(code);
                  }
                }}
                role={canSelect ? "button" : "img"}
                tabIndex={canSelect ? 0 : undefined}
              >
                {showName && <title>{`${name}: ${description}`}</title>}
              </path>
            );
          })}
          {showStateLabels
            ? US_STATE_SHAPES.map(({ code, labelX, labelY }) => (
                <text
                  aria-hidden="true"
                  className="state-map-label"
                  key={`label-${code}`}
                  x={labelX}
                  y={labelY}
                >
                  {code}
                </text>
              ))
            : null}
        </g>
      </svg>
    </div>
  );
}
