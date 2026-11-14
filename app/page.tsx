import Link from "next/link";
import { BrowserBorderHunt } from "@/components/BrowserBorderHunt";

export default function Home() {
  return (
    <>
      <BrowserBorderHunt />
      <section
        aria-labelledby="about-maptrail"
        className="relative mx-auto max-w-7xl border-t border-[var(--line)] px-4 py-6 text-sm leading-6 text-[var(--ink-soft)] sm:px-6 lg:px-8"
      >
        <h2 id="about-maptrail" className="font-display text-xl font-bold text-[var(--ink)]">
          MapTrail — a free geography guessing game
        </h2>
        <p className="mt-2 max-w-3xl">
          MapTrail is a free online geography game where you guess U.S. states and countries
          using borders, map hints, and progressively revealed clues.
        </p>
        <p className="mt-2 max-w-3xl">
          <Link className="rounded-sm font-semibold text-[var(--forest)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" href="/">
            Border Hunt
          </Link>{" "}
          uses land borders and map hints to find a mystery U.S. state or European country.{" "}
          <Link className="rounded-sm font-semibold text-[var(--forest)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" href="/clue-ladder/">
            Clue Ladder
          </Link>{" "}
          reveals geography clues to help you identify a mystery U.S. state.
        </p>
      </section>
      <footer className="relative mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 pb-6 text-center text-xs text-[var(--ink-soft)] sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-[var(--ink)]">Made by Arun Subedi</p>
        <p>Built as a personal geography game project.</p>
        <a
          aria-label="Arun Subedi on LinkedIn"
          className="rounded-sm underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--forest)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forest)]"
          href="https://www.linkedin.com/in/arunsbd"
        >
          LinkedIn
        </a>
      </footer>
    </>
  );
}
