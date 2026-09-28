import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("static hosting configuration", () => {
  it("exports static files with directory-style URLs", async () => {
    const { default: config } = await import("../next.config");
    expect(config.output).toBe("export");
    expect(config.trailingSlash).toBe(true);
  });

  it("uses the domain root for local development or a custom domain", async () => {
    vi.stubEnv("BASE_PATH", undefined);
    const { default: config } = await import("../next.config");
    expect(config.basePath).toBe("");
  });

  it("uses the GitHub Pages subdirectory when supplied at build time", async () => {
    vi.stubEnv("BASE_PATH", "/MapTrail");
    const { default: config } = await import("../next.config");
    expect(config.basePath).toBe("/MapTrail");
  });
});
