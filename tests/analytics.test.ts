import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = vi.hoisted(() => ({
  __loaded: false,
  capture: vi.fn(),
  init: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthogMock }));

import {
  analytics,
  createAnalyticsClient,
  hasAnalyticsConfiguration,
  initializeAnalytics,
} from "@/lib/analytics";

describe("analytics", () => {
  beforeEach(() => {
    posthogMock.__loaded = false;
    posthogMock.capture.mockReset();
    posthogMock.init.mockReset();
    vi.stubGlobal("window", {});
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not enable analytics without both configuration values", () => {
    expect(hasAnalyticsConfiguration("", "")).toBe(false);
    expect(hasAnalyticsConfiguration("token", "")).toBe(false);
    expect(hasAnalyticsConfiguration(" ", "https://us.i.posthog.com")).toBe(false);
    expect(hasAnalyticsConfiguration("token", "https://us.i.posthog.com")).toBe(true);
  });

  it("maps typed gameplay methods to the intended event names", () => {
    const capture = vi.fn();
    const client = createAnalyticsClient(capture);

    client.gameStarted({
      game_mode: "border_hunt",
      region: "europe",
      difficulty: "hard",
      easy_mode: false,
    });
    client.clueRevealed({
      game_mode: "clue_ladder",
      region: "us",
      clue_number: 2,
      clue_category: "time_zone",
    });

    expect(capture).toHaveBeenNthCalledWith(1, "game_started", {
      game_mode: "border_hunt",
      region: "europe",
      difficulty: "hard",
      easy_mode: false,
    });
    expect(capture).toHaveBeenNthCalledWith(2, "clue_revealed", {
      game_mode: "clue_ladder",
      region: "us",
      clue_number: 2,
      clue_category: "time_zone",
    });
  });

  it("initializes the PostHog singleton with automatic analytics intact", () => {
    expect(initializeAnalytics()).toBe(true);
    expect(posthogMock.init).toHaveBeenCalledWith("phc_test", {
      api_host: "https://us.i.posthog.com",
      defaults: "2026-05-30",
      disable_session_recording: true,
    });
  });

  it("captures configured gameplay events through the PostHog singleton", () => {
    analytics.gameStarted({
      game_mode: "border_hunt",
      region: "us",
      difficulty: "intermediate",
      easy_mode: false,
    });
    analytics.guessSubmitted({
      game_mode: "clue_ladder",
      region: "us",
      guess_number: 2,
      clues_revealed: 3,
      is_correct: false,
    });
    analytics.clueRevealed({
      game_mode: "clue_ladder",
      region: "us",
      clue_number: 3,
      clue_category: "time_zone",
    });

    expect(posthogMock.capture).toHaveBeenNthCalledWith(1, "game_started", {
      game_mode: "border_hunt",
      region: "us",
      difficulty: "intermediate",
      easy_mode: false,
    });
    expect(posthogMock.capture).toHaveBeenNthCalledWith(2, "guess_submitted", {
      game_mode: "clue_ladder",
      region: "us",
      guess_number: 2,
      clues_revealed: 3,
      is_correct: false,
    });
    expect(posthogMock.capture).toHaveBeenNthCalledWith(3, "clue_revealed", {
      game_mode: "clue_ladder",
      region: "us",
      clue_number: 3,
      clue_category: "time_zone",
    });
  });

  it("skips custom events safely when analytics configuration is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");

    expect(() =>
      analytics.gameStarted({
        game_mode: "clue_ladder",
        region: "us",
      }),
    ).not.toThrow();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it("swallows transport errors", () => {
    const client = createAnalyticsClient(() => {
      throw new Error("analytics unavailable");
    });

    expect(() =>
      client.instructionsOpened({ game_mode: "border_hunt", region: "us" }),
    ).not.toThrow();
  });
});
