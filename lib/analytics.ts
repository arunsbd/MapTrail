import posthog from "posthog-js";
import type { Difficulty } from "@/lib/difficulty";
import type { ClueCategory } from "@/lib/clue-ladder/types";

export type AnalyticsGameMode = "border_hunt" | "clue_ladder";
export type AnalyticsRegion = "us" | "europe";
export type AnalyticsMapCategory = Extract<
  ClueCategory,
  "map_position" | "parks" | "time_zone"
>;

type GameSelectedProperties = {
  game_mode: AnalyticsGameMode;
  region: AnalyticsRegion;
};

type GameStartedProperties =
  | {
      game_mode: "border_hunt";
      region: AnalyticsRegion;
      difficulty: Difficulty;
      easy_mode: boolean;
    }
  | {
      game_mode: "clue_ladder";
      region: "us";
    };

type GuessSubmittedProperties =
  | {
      game_mode: "border_hunt";
      region: AnalyticsRegion;
      guess_number: number;
      is_correct: boolean;
      border_distance: number | null;
      proximity: string;
    }
  | {
      game_mode: "clue_ladder";
      region: "us";
      guess_number: number;
      clues_revealed: number;
      is_correct: boolean;
    };

type GameCompletedProperties =
  | {
      game_mode: "border_hunt";
      region: AnalyticsRegion;
      won: boolean;
      guess_count: number;
      duration_seconds: number;
      difficulty: Difficulty;
      easy_mode: boolean;
      target_name: string;
    }
  | {
      game_mode: "clue_ladder";
      region: "us";
      won: boolean;
      guess_count: number;
      clues_revealed: number;
      duration_seconds: number;
    };

type Capture = (event: string, properties: object) => void;

export function createAnalyticsClient(capture: Capture) {
  function safelyCapture(event: string, properties: object) {
    try {
      capture(event, properties);
    } catch {
      // Analytics must never interrupt gameplay.
    }
  }

  return {
    gameSelected(properties: GameSelectedProperties) {
      safelyCapture("game_selected", properties);
    },
    gameStarted(properties: GameStartedProperties) {
      safelyCapture("game_started", properties);
    },
    guessSubmitted(properties: GuessSubmittedProperties) {
      safelyCapture("guess_submitted", properties);
    },
    gameCompleted(properties: GameCompletedProperties) {
      safelyCapture("game_completed", properties);
    },
    playAgainClicked(properties: GameSelectedProperties) {
      safelyCapture("play_again_clicked", properties);
    },
    clueRevealed(properties: {
      game_mode: "clue_ladder";
      region: "us";
      clue_number: number;
      clue_category: ClueCategory;
    }) {
      safelyCapture("clue_revealed", properties);
    },
    mapClueViewed(properties: {
      game_mode: "clue_ladder";
      region: "us";
      map_category: AnalyticsMapCategory;
    }) {
      safelyCapture("map_clue_viewed", properties);
    },
    instructionsOpened(properties: GameSelectedProperties) {
      safelyCapture("instructions_opened", properties);
    },
  };
}

export function hasAnalyticsConfiguration(
  projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  host = process.env.NEXT_PUBLIC_POSTHOG_HOST,
) {
  return Boolean(projectToken?.trim() && host?.trim());
}

export function initializeAnalytics() {
  if (typeof window === "undefined") return false;

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!hasAnalyticsConfiguration(projectToken, host)) return false;
  if (posthog.__loaded) return true;

  try {
    posthog.init(projectToken!, {
      api_host: host,
      defaults: "2026-05-30",
      disable_session_recording: true,
    });
    return true;
  } catch {
    return false;
  }
}

export const analytics = createAnalyticsClient((event, properties) => {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
});
