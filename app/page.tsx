import { BrowserBorderHunt } from "@/components/BrowserBorderHunt";

export default function Home() {
  return (
    <>
      <BrowserBorderHunt />
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
