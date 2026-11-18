import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Payments · cramly.ai",
  description:
    "A Stripe-inspired payments workspace. Explore sandbox payments, customers, and transaction details.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
