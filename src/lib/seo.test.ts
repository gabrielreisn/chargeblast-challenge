import { afterEach, expect, test, vi } from "vitest";
import { transactionRoutes } from "./transaction-routes";
import {
  privateMetadata,
  robotsRules,
  rootMetadata,
  routeMetadata,
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

test("lists every transactions tab in the sitemap with absolute URLs", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://demo.example.com");
  expect(sitemapEntries().map((entry) => entry.url)).toEqual(
    transactionRoutes.map((route) => `https://demo.example.com/${route.segment}`),
  );
});

test("robots allows crawling and points at the sitemap", () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://demo.example.com");
  expect(robotsRules()).toMatchObject({
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://demo.example.com/sitemap.xml",
  });
});

test("route metadata only sets the tab's title and description", () => {
  expect(routeMetadata("standalone-3ds")).toEqual({
    title: "Standalone 3DS",
    description: "Review 3D Secure authentications run outside of a payment.",
  });
});

test("shared defaults resolve canonical and og:url per page and leave titles to each page", () => {
  expect(rootMetadata.alternates).toEqual({ canonical: "./" });
  expect(rootMetadata.openGraph).toMatchObject({ url: "./", siteName: "cramly.ai" });
  // A shared og:title would override the page title Next copies in, so there must be none.
  expect(rootMetadata.openGraph).not.toHaveProperty("title");
  expect(rootMetadata.twitter).not.toHaveProperty("title");
});

test("private pages are excluded from search indexing", () => {
  const metadata = privateMetadata("Payment details");
  expect(metadata.robots).toEqual({ index: false, follow: false });
  expect(metadata.alternates).toEqual({ canonical: null });
});

test("the web manifest starts on the payments list", () => {
  expect(webManifest()).toMatchObject({ start_url: "/payments", display: "standalone" });
});
