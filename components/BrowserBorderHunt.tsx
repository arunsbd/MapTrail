"use client";

import dynamic from "next/dynamic";

// Start each round in the browser, not once for everyone during static export.
export const BrowserBorderHunt = dynamic(
  () => import("@/components/BorderHuntGame").then((module) => module.BorderHuntGame),
  {
    ssr: false,
    loading: () => (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="eyebrow">MapTrail · Border Hunt</p>
          <p className="mt-3 text-lg font-bold" role="status">Opening your trail…</p>
          <noscript>Enable JavaScript in your browser to play MapTrail.</noscript>
        </div>
      </main>
    ),
  },
);
