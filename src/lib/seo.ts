import type { Metadata, MetadataRoute, Viewport } from "next";
import { transactionRoutes, type TransactionSegment } from "./transaction-routes";

/**
 * Single source of truth for metadata and SEO. Route files only call the
 * helpers below; they never build `Metadata` objects by hand.
 */
export const site = {
  name: "cramly.ai",
  title: "cramly.ai Payments",
  description:
    "A Stripe-inspired payments workspace. Explore sandbox payments, payouts, top-ups and transaction details.",
  locale: "en_US",
  themeColor: "#635bff",
  backgroundColor: "#ffffff",
} as const;

/**
 * Absolute origin used for canonical URLs, Open Graph and the sitemap.
 * `NEXT_PUBLIC_SITE_URL` wins; Vercel's production domain is the fallback.
 */
export function siteUrl() {
  // `||`, not `??`: an empty variable (common in .env files) must fall through.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || null;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || null;
  const local = `http://localhost:${process.env.PORT || 3000}`;
  return new URL(explicit ?? (vercel ? `https://${vercel}` : local));
}

/** Size and alt text for `app/opengraph-image.tsx`; Next adds the image to every page's tags. */
export const ogImage = {
  width: 1200,
  height: 630,
  alt: site.title,
  type: "image/png",
} as const;

/**
 * Shared defaults every page inherits. Pages set only `title` and `description`; Next copies
 * them into the Open Graph and Twitter tags (titles go through the template). The `./` URLs
 * resolve against each page's own pathname, so canonical and `og:url` need no per-route value.
 * Metadata merges shallowly, so a page that sets `openGraph` or `twitter` replaces these.
 */
export const rootMetadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "./" },
  openGraph: { type: "website", siteName: site.name, locale: site.locale, url: "./" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  colorScheme: "light",
};

/** Title and description for a Transactions tab; everything else comes from `rootMetadata`. */
export function routeMetadata(segment: TransactionSegment): Metadata {
  const { label, description } = transactionRoutes.find((route) => route.segment === segment)!;
  return { title: label, description };
}

/** Pages that exist for people but must stay out of search results (record details, errors). */
export function privateMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false }, alternates: { canonical: null } };
}

export function sitemapEntries(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  return transactionRoutes.map((route) => ({
    url: new URL(`/${route.segment}`, origin).toString(),
  }));
}

export function robotsRules(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}

export function webManifest(): MetadataRoute.Manifest {
  return {
    name: site.title,
    short_name: site.name,
    description: site.description,
    start_url: "/payments",
    display: "standalone",
    background_color: site.backgroundColor,
    theme_color: site.themeColor,
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
