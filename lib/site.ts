export const SITE_NAME = "MapTrail";
export const SITE_TITLE = "MapTrail — Geography Games";
export const SITE_DESCRIPTION =
  "Explore maps, follow clues, and test your geography knowledge with MapTrail's Border Hunt and Clue Ladder games.";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://arunsbd.github.io/MapTrail/";

export const SITE_URL = new URL(
  configuredSiteUrl.endsWith("/") ? configuredSiteUrl : `${configuredSiteUrl}/`,
);
