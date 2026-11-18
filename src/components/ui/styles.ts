/**
 * Tailwind class recipes shared across components. Keep one recipe per visual
 * pattern; variants must not set the same CSS property as the base so plain
 * concatenation never conflicts.
 */
type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "default" | "primary";
type ButtonSize = "md" | "sm" | "icon";
type ButtonOptions = { variant?: ButtonVariant; size?: ButtonSize };

const buttonVariants: Record<ButtonVariant, string> = {
  default:
    "border-line-strong bg-white text-ink enabled:hover:border-[#b8bfcb] enabled:hover:bg-wash",
  primary: "border-brand bg-brand text-white enabled:hover:bg-brand-hover",
};

const buttonSizes: Record<ButtonSize, string> = {
  md: "min-h-6.75 px-2.25 py-1.25 text-11 leading-3.75",
  sm: "min-h-6 px-1.75 py-0.75 text-10",
  icon: "size-6.75",
};

export function buttonStyles({ variant = "default", size = "md" }: ButtonOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-1.25 rounded-[5px] border font-semibold whitespace-nowrap shadow-button",
    "disabled:cursor-default disabled:opacity-40 aria-disabled:cursor-default aria-disabled:opacity-70",
    buttonVariants[variant],
    buttonSizes[size],
  );
}

// Display and padding are left out so callers can choose them without conflicts.
const iconButtonLook =
  "items-center justify-center rounded text-[#717c8e] hover:bg-[#f0f2f6] hover:text-[#343c4d] disabled:cursor-default disabled:opacity-40";

export const iconButtonStyles = cn("inline-flex p-0.75", iconButtonLook);

/** Icon button hidden below the `md` breakpoint (top bar shortcuts). */
export const desktopIconButtonStyles = cn("hidden p-0.75 md:inline-flex", iconButtonLook);

/** Borderless icon button that fits inside a compact table row. */
export const rowIconButtonStyles = cn("flex h-4.5 w-5", iconButtonLook);

export const textButtonStyles = "p-0.75 text-10 text-brand hover:text-brand-hover";

export const fieldStyles =
  "w-full rounded-[5px] border border-field-line bg-white px-2.5 py-2 text-12 text-ink placeholder:text-[#8490a0]";

/** Surface for Radix popovers and dropdown menus. */
export const floatingPanelStyles =
  "z-60 rounded-[7px] border border-[#e0e3eb] bg-white shadow-popover animate-pop-in motion-reduce:animate-none";

export const menuStyles = cn(floatingPanelStyles, "min-w-55 p-1.5 text-12");

export const menuItemStyles =
  "flex cursor-pointer items-center justify-between gap-3 rounded p-2 outline-none data-highlighted:bg-brand-tint data-highlighted:text-brand";

export const menuLabelStyles = "block px-2 py-1.5 text-10 text-[#8993a3]";

export const menuSeparatorStyles = "-mx-1.5 my-1.25 h-px bg-[#e8ebf0]";

export const noteStyles = "my-1.5 text-10 leading-4 text-[#8490a0]";
