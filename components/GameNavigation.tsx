"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { analytics, type AnalyticsRegion } from "@/lib/analytics";
import { shouldConfirmGameSwitch } from "@/lib/game-navigation";
import type { GameMode } from "@/lib/onboarding";

const GAMES = [
  {
    mode: "border-hunt" as const,
    name: "Border Hunt",
    href: "/",
    description: "Follow borders and connection clues to find the mystery place.",
  },
  {
    mode: "clue-ladder" as const,
    name: "Clue Ladder",
    href: "/clue-ladder/",
    description: "Reveal clues and solve early for the highest score.",
  },
] as const;

export function GameNavigation({
  activeMode,
  hasProgress,
  region = "us",
}: {
  activeMode: GameMode;
  hasProgress: boolean;
  region?: AnalyticsRegion;
}) {
  function confirmSwitch(
    event: MouseEvent<HTMLAnchorElement>,
    targetMode: GameMode,
  ) {
    if (targetMode === activeMode) return;

    if (
      shouldConfirmGameSwitch(activeMode, targetMode, hasProgress) &&
      !window.confirm(
        "Switch games? Your current round will stay on this page, but it is not saved if you leave.",
      )
    ) {
      event.preventDefault();
      return;
    }

    analytics.gameSelected({
      game_mode: targetMode === "border-hunt" ? "border_hunt" : "clue_ladder",
      region: targetMode === "clue-ladder" ? "us" : region,
    });
  }

  return (
    <nav aria-label="Games" className="game-navigation">
      <span className="game-navigation__label">Games</span>
      <div className="game-navigation__links">
        {GAMES.map((game) => (
          <Link
            aria-current={activeMode === game.mode ? "page" : undefined}
            className="game-navigation__link"
            href={game.href}
            key={game.mode}
            onClick={(event) => confirmSwitch(event, game.mode)}
          >
            <strong>{game.name}</strong>
            <span>{game.description}</span>
          </Link>
        ))}
        <span aria-disabled="true" className="game-navigation__link game-navigation__link--disabled">
          <strong>Border Chain</strong>
          <span>Coming later</span>
        </span>
      </div>
    </nav>
  );
}
