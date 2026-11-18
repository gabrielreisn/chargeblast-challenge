import { useId, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/components/ui/styles";

type EmptyStateTone = "neutral" | "critical";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  learnMoreHref?: string;
  tone?: EmptyStateTone;
  headingLevel?: "h1" | "h2";
  /** Less vertical padding, for use inside another surface such as a table. */
  compact?: boolean;
  /** Actions rendered below the copy. */
  children?: ReactNode;
  /** Secondary details rendered after the actions. */
  footer?: ReactNode;
};

const iconToneStyles: Record<EmptyStateTone, string> = {
  neutral: "bg-field text-[#545969]",
  critical: "bg-danger-soft text-danger-strong",
};

export function EmptyState({
  icon,
  title,
  description,
  learnMoreHref,
  tone = "neutral",
  headingLevel: Heading = "h2",
  compact = false,
  children,
  footer,
}: EmptyStateProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn("flex justify-center px-5", compact ? "py-12" : "pt-30 pb-20")}
    >
      <div className="w-full max-w-95">
        <div
          className={cn("mb-3 grid size-10 place-items-center rounded-[7px]", iconToneStyles[tone])}
          aria-hidden="true"
        >
          {icon}
        </div>
        <Heading
          id={titleId}
          className="mb-1 text-16 leading-5.5 font-[650] tracking-[-0.2px] text-ink-strong"
        >
          {title}
        </Heading>
        <p className="text-12 leading-4.5 text-subtle">{description}</p>
        {learnMoreHref && (
          <a
            className="mt-1 inline-flex items-center gap-1.25 text-12 leading-4.5 font-medium text-brand hover:text-brand-hover"
            href={learnMoreHref}
            target="_blank"
            rel="noreferrer"
          >
            Learn more <ArrowRight size={13} aria-hidden="true" />
          </a>
        )}
        {children && <div className="mt-3.5 flex flex-wrap gap-2">{children}</div>}
        {footer}
      </div>
    </section>
  );
}
