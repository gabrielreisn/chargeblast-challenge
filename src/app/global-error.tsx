"use client";
import "./globals.css";
import { ErrorState, type ErrorBoundaryProps } from "@/components/feedback/error-state";
import { site } from "@/lib/seo";

// Last-resort boundary for failures in the root layout. It replaces the whole
// document, so it renders its own <html>/<body> and imports global styles.
export default function GlobalError(props: ErrorBoundaryProps) {
  return (
    <html lang="en">
      <body>
        <title>{`Something went wrong · ${site.name}`}</title>
        <main className="grid min-h-screen place-items-center">
          <ErrorState {...props} headingLevel="h1" homeHref={null} />
        </main>
      </body>
    </html>
  );
}
