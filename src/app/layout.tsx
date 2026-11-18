import "./globals.css";
import { rootMetadata, viewport as rootViewport } from "@/lib/seo";

export const metadata = rootMetadata;
export const viewport = rootViewport;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <a
          className="fixed -top-25 left-5 z-100 bg-brand p-3 text-white focus:top-2.5"
          href="#main-content"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
