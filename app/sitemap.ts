import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL.toString(), changeFrequency: "weekly", priority: 1 },
    {
      url: new URL("clue-ladder/", SITE_URL).toString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
