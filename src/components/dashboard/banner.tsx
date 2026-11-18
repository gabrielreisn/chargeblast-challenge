"use client";
import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn, iconButtonStyles } from "@/components/ui/styles";

type BannerAction = { label: ReactNode; href: string };

type BannerProps = { icon: ReactNode; children: ReactNode; action: BannerAction };

/** Dismissible announcement shown above a transactions view. */
export function Banner({ icon, children, action }: BannerProps) {
  // Dismissal is a user action with no other source of truth.
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="mt-4.25 flex items-start gap-2 rounded-[5px] border border-[#edf0f5] bg-wash px-2.5 py-1.75 text-10 leading-4 text-[#667185] md:items-center">
      <span className="flex shrink-0 text-[#454c5e]">{icon}</span>
      <span className="flex-1 md:flex-none">{children}</span>
      <a
        className="ml-auto hidden items-center gap-1.5 font-medium whitespace-nowrap text-brand hover:text-brand-hover md:flex"
        href={action.href}
        target="_blank"
        rel="noreferrer"
      >
        {action.label}
      </a>
      <button
        type="button"
        className={cn(iconButtonStyles, "ml-auto md:ml-1.5")}
        aria-label="Dismiss announcement"
        onClick={() => setVisible(false)}
      >
        <X size={13} />
      </button>
    </div>
  );
}
