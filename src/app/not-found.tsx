import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonStyles } from "@/components/ui/styles";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata("Not found");

export default function NotFound() {
  return (
    <EmptyState
      headingLevel="h1"
      icon={<SearchX size={18} />}
      title="Page not found"
      description="This page or payment isn’t in the current dataset."
    >
      <Link className={buttonStyles({ variant: "primary" })} href="/payments">
        Back to payments
      </Link>
    </EmptyState>
  );
}
