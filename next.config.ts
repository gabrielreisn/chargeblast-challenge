import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The dashboard has no home page. Redirecting here, before routing, keeps `/`
  // out of instant-navigation validation, which a page-level redirect() would fail.
  redirects() {
    return [{ source: "/", destination: "/payments", permanent: false }];
  },
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
