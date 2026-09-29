import { describe, expect, it, vi } from "vitest";
import {
  createAnalyticsClient,
  hasAnalyticsConfiguration,
} from "@/lib/analytics";

describe("analytics", () => {
  it("does not enable analytics without both configuration values", () => {
    expect(hasAnalyticsConfiguration(undefined, undefined)).toBe(false);
    expect(hasAnalyticsConfiguration("token", undefined)).toBe(false);
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

  it("swallows transport errors", () => {
    const client = createAnalyticsClient(() => {
      throw new Error("analytics unavailable");
    });

    expect(() =>
      client.instructionsOpened({ game_mode: "border_hunt", region: "us" }),
    ).not.toThrow();
  });
});
