import type { Metadata } from "next";
import { ClueLadderGame } from "@/components/ClueLadderGame";
import { loadClueLadderHintData } from "@/lib/clue-ladder/hints";
import { loadPlayablePuzzles } from "@/lib/clue-ladder/playable";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const title = "MapTrail — Clue Ladder";
const description =
  "Guess a mystery U.S. state in seven clues. Explore all 50 states in Clue Ladder.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: new URL("clue-ladder/", SITE_URL).toString() },
  openGraph: {
    type: "website",
    url: new URL("clue-ladder/", SITE_URL),
    siteName: SITE_NAME,
    title,
    description,
  },
  twitter: { card: "summary", title, description },
};

export default function ClueLadderPage() {
  return (
    <ClueLadderGame
      hints={loadClueLadderHintData()}
      puzzles={loadPlayablePuzzles()}
    />
  );
}
