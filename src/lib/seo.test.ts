import { afterEach, expect, test, vi } from "vitest";
import {
  privateMetadata,
  robotsRules,
  routeMetadata,
  routes,
  sitemapEntries,
  siteUrl,
  webManifest,
} from "./seo";

afterEach(() => vi.unstubAllEnvs());

test("resolves the site origin from the explicit URL, then Vercel's production domain", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "payments.example.com");
  expect(siteUrl().origin).toBe("https://payments.example.com");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://demo.example.com");
  expect(siteUrl().origin).toBe("https://demo.example.com");
});

test("lists every public route in the sitemap with absolute URLs", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://demo.example.com");
  expect(sitemapEntries().map((entry) => entry.url)).toEqual(
    Object.values(routes).map((route) => `https://demo.example.com${route.path}`),
  );
});

test("robots allows crawling and points at the sitemap", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://demo.example.com");
  expect(robotsRules()).toMatchObject({
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://demo.example.com/sitemap.xml",
  });
});

test("route metadata sets a canonical URL and keeps the shared social defaults", () => {
  const metadata = routeMetadata("payouts");
  expect(metadata).toMatchObject({
    title: "Payouts",
    alternates: { canonical: "/payouts" },
    openGraph: { siteName: "cramly.ai", type: "website", url: "/payouts" },
    twitter: { card: "summary_large_image" },
  });
});

test("private pages are excluded from search indexing", () => {
  expect(privateMetadata("Payment details").robots).toEqual({ index: false, follow: false });
});

test("the web manifest starts on the payments list", () => {
  expect(webManifest()).toMatchObject({ start_url: "/payments", display: "standalone" });
});

test("public routes keep the shared Open Graph image when they override openGraph", () => {
  const metadata = routeMetadata("payments");
  expect(metadata.openGraph).toMatchObject({ images: [{ url: "/opengraph-image" }] });
  expect(metadata.twitter).toMatchObject({ images: [{ url: "/opengraph-image" }] });
});
