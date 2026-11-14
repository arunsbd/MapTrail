import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, SOCIAL_IMAGE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true, "max-image-preview": "large" },
  alternates: {
    canonical: SITE_URL.toString(),
  },
  manifest: `${process.env.BASE_PATH ?? ""}/manifest.webmanifest`,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE.url],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#245e50",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://playmaptrail.com/#website",
      name: SITE_NAME,
      url: SITE_URL.toString(),
      description: SITE_DESCRIPTION,
      mainEntity: {
        "@id": "https://playmaptrail.com/#application",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://playmaptrail.com/#application",
      name: SITE_NAME,
      url: SITE_URL.toString(),
      description: SITE_DESCRIPTION,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript and a modern web browser",
      isAccessibleForFree: true,
      isPartOf: {
        "@id": "https://playmaptrail.com/#website",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
