"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  ArrowRightLeft,
  ChevronDown,
  Clock,
  ExternalLink,
  FlaskConical,
  House,
  Menu,
  Package,
  Pin,
  SquareTerminal,
  UserRound,
  X,
  createLucideIcon,
  type LucideIcon,
} from "lucide-react";
import { Hint } from "@/components/ui/hint";
import {
  cn,
  iconButtonStyles,
  menuItemStyles,
  menuLabelStyles,
  menuSeparatorStyles,
  menuStyles,
  navItemHover,
  navItemLayout,
  navItemText,
} from "@/components/ui/styles";
import { ProductsNav, products, type ProductLink } from "./products-nav";
import { UNAVAILABLE_HINT, UnavailableNavLink } from "./unavailable-nav-link";

/** Lucide has no ledger-with-coin glyph like Stripe's Balances icon, so draw one in its style. */
const Balances = createLucideIcon("balances", [
  ["path", { d: "M3 5h18", key: "top" }],
  ["path", { d: "M3 10h11", key: "middle" }],
  ["path", { d: "M3 15h6", key: "bottom" }],
  ["circle", { cx: "17", cy: "16.5", r: "4", key: "coin" }],
]);

type NavEntry = { icon: LucideIcon; label: string };

const primaryNav: NavEntry[] = [
  { icon: House, label: "Home" },
  { icon: Balances, label: "Balances" },
];
const secondaryNav: NavEntry[] = [
  { icon: UserRound, label: "Customers" },
  { icon: Package, label: "Product catalog" },
];
// Stripe pins the first shortcut and marks recently visited pages with a clock.
const pinnedShortcuts: NavEntry[] = [{ icon: Pin, label: "Payments analytics" }];
const recentShortcuts: NavEntry[] = [
  { icon: Clock, label: "Reports" },
  { icon: Clock, label: "Sigma" },
  { icon: Clock, label: "Radar" },
];
const navSectionStyles = "mx-2.25 mt-6.25 mb-1.5 text-10 text-[#8490a0]";
const navIconProps = { size: 14, strokeWidth: 1.7, "aria-hidden": true } as const;

const SIDEBAR_ID = "dashboard-sidebar";
const DOCS_URL = "https://docs.stripe.com";

/** Square icon button for the collapsed rail; labels move into tooltips. */
const railItemStyles = cn(
  "flex size-8 shrink-0 items-center justify-center rounded-[5px] text-[#586577]",
  navItemHover,
);
const railIconProps = { size: 16, strokeWidth: 1.7, "aria-hidden": true } as const;

function UnavailableNavItem({ icon: Icon, label }: NavEntry) {
  return (
    <UnavailableNavLink
      className={cn(
        navItemLayout,
        navItemText,
        navItemHover,
        "w-full cursor-default px-2.25 text-left",
      )}
    >
      <Icon {...navIconProps} />
      {label}
    </UnavailableNavLink>
  );
}

function AccountLogo() {
  return (
    <span
      className="inline-flex size-5.75 items-center justify-center rounded bg-[#d7c4fb] font-serif text-20 font-bold text-[#352353]"
      aria-hidden="true"
    >
      c
    </span>
  );
}

type AccountMenuProps = { compact?: boolean };

function AccountMenu({ compact = false }: AccountMenuProps) {
  return (
    <Dropdown.Root>
      {compact ? (
        <Hint text="cramly.ai" side="right">
          <Dropdown.Trigger className={railItemStyles} aria-label="cramly.ai account">
            <AccountLogo />
          </Dropdown.Trigger>
        </Hint>
      ) : (
        <Dropdown.Trigger className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[5px] px-1.75 text-left text-13">
          <AccountLogo />
          <strong>cramly.ai</strong>
          <ChevronDown size={13} className="ml-auto text-[#7b8794]" aria-hidden="true" />
        </Dropdown.Trigger>
      )}
      <Dropdown.Portal>
        <Dropdown.Content
          className={menuStyles}
          side={compact ? "right" : "bottom"}
          align="start"
          sideOffset={6}
        >
          <Dropdown.Label className={menuLabelStyles}>Your account</Dropdown.Label>
          <div className="flex items-center gap-2.5 p-2.25">
            <AccountLogo />
            <span>
              <strong className="text-12">cramly.ai</strong>
              <small className="mt-0.75 block text-10 text-[#8a95a6]">Demo workspace</small>
            </span>
          </div>
          <Dropdown.Separator className={menuSeparatorStyles} />
          <Dropdown.Item className={menuItemStyles}>
            Sandbox
            <span className="rounded bg-[#e9f6eb] px-1.25 py-px text-9 text-[#387e4d]">Active</span>
          </Dropdown.Item>
          <Dropdown.Item asChild className={menuItemStyles}>
            <a href="https://dashboard.stripe.com/sandboxes" target="_blank" rel="noreferrer">
              Open Stripe Dashboard <ExternalLink size={13} aria-hidden="true" />
            </a>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

type SidebarContentProps = {
  /** Rendered beside the account switcher (the drawer's close button). */
  headerAction?: ReactNode;
  /** Inside the mobile drawer, in-app links also close the drawer. */
  inDrawer?: boolean;
};

function SidebarContent({ headerAction, inDrawer = false }: SidebarContentProps) {
  const transactionsLink = (
    <Link
      className={cn(navItemLayout, "px-2.25 text-11 font-semibold text-brand 2xl:text-12")}
      href="/payments"
      aria-current="page"
    >
      <ArrowRightLeft {...navIconProps} />
      Transactions
    </Link>
  );
  return (
    <>
      <div className="mb-5.75 flex items-center gap-1">
        <AccountMenu />
        {headerAction}
      </div>
      <nav aria-label="Main navigation" className="-mx-3 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {primaryNav.map((entry) => (
          <UnavailableNavItem key={entry.label} {...entry} />
        ))}
        {inDrawer ? <Dialog.Close asChild>{transactionsLink}</Dialog.Close> : transactionsLink}
        {secondaryNav.map((entry) => (
          <UnavailableNavItem key={entry.label} {...entry} />
        ))}
        <div className={navSectionStyles}>Shortcuts</div>
        {[...pinnedShortcuts, ...recentShortcuts].map((entry) => (
          <UnavailableNavItem key={entry.label} {...entry} />
        ))}
        <div className={navSectionStyles}>Products</div>
        <ProductsNav />
      </nav>
      <div className="border-t border-line py-2">
        <a
          className={cn(
            navItemLayout,
            "px-2.25 text-10 font-medium text-[#586577] hover:bg-nav-hover",
          )}
          href={DOCS_URL}
          target="_blank"
          rel="noreferrer"
        >
          <SquareTerminal {...navIconProps} />
          Developers
          <ExternalLink size={11} className="ml-auto" aria-hidden="true" />
        </a>
      </div>
    </>
  );
}

function RailItem({ icon: Icon, label }: NavEntry) {
  return (
    <UnavailableNavLink label={label} className={cn(railItemStyles, "cursor-default")}>
      <Icon {...railIconProps} />
    </UnavailableNavLink>
  );
}

type RailFlyoutProps = NavEntry & { links: ProductLink[] };

/**
 * A group the rail can't list inline (recent pages, a product's pages). Like Stripe, its icon
 * opens the pages in a menu beside the rail; here they are reference-only, so disabled.
 */
function RailFlyout({ icon: Icon, label, links }: RailFlyoutProps) {
  return (
    <Dropdown.Root>
      <Hint text={label} side="right">
        <Dropdown.Trigger
          className={cn(railItemStyles, "data-[state=open]:bg-nav-hover")}
          aria-label={label}
        >
          <Icon {...railIconProps} />
        </Dropdown.Trigger>
      </Hint>
      <Dropdown.Portal>
        <Dropdown.Content className={menuStyles} side="right" align="start" sideOffset={10}>
          <Dropdown.Label className={cn(menuLabelStyles, "font-semibold text-ink")}>
            {label}
          </Dropdown.Label>
          {links.map((link) => (
            <Dropdown.Item
              key={link.label}
              disabled
              className={cn(
                menuItemStyles,
                "data-disabled:cursor-default data-disabled:text-muted",
              )}
            >
              {link.label}
              {link.preview && <FlaskConical size={11} strokeWidth={1.7} aria-label="Preview" />}
            </Dropdown.Item>
          ))}
          <Dropdown.Separator className={menuSeparatorStyles} />
          <p className={menuLabelStyles}>{UNAVAILABLE_HINT}</p>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

const railDividerStyles = "my-2.5 h-px w-5 shrink-0 bg-line";

/** The collapsed sidebar: Stripe's icon rail, with every label moved into a tooltip. */
function RailContent() {
  return (
    <>
      <div className="mb-5.75 flex justify-center">
        <AccountMenu compact />
      </div>
      <nav
        aria-label="Main navigation"
        className="-mx-2 flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-y-auto px-2 pb-3"
      >
        {primaryNav.map((entry) => (
          <RailItem key={entry.label} {...entry} />
        ))}
        <Hint text="Transactions" side="right">
          <Link
            className={cn(railItemStyles, "text-brand hover:text-brand")}
            href="/payments"
            aria-current="page"
            aria-label="Transactions"
          >
            <ArrowRightLeft {...railIconProps} />
          </Link>
        </Hint>
        {secondaryNav.map((entry) => (
          <RailItem key={entry.label} {...entry} />
        ))}
        <div className={railDividerStyles} aria-hidden="true" />
        {pinnedShortcuts.map((entry) => (
          <RailItem key={entry.label} {...entry} />
        ))}
        <RailFlyout icon={Clock} label="Recent pages" links={recentShortcuts} />
        <div className={railDividerStyles} aria-hidden="true" />
        {products.map((product) => (
          <RailFlyout key={product.label} {...product} />
        ))}
      </nav>
      <div className="-mx-2 flex justify-center border-t border-line py-2">
        <Hint text="Developers" side="right">
          <a
            className={railItemStyles}
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Developers (opens Stripe docs)"
          >
            <SquareTerminal {...railIconProps} />
          </a>
        </Hint>
      </div>
    </>
  );
}

type DesktopSidebarProps = { collapsed: boolean };

/**
 * Fixed sidebar from `md` up. Collapsed, it narrows to an icon rail (its width comes from the
 * shell's `--sidebar`, so content and sidebar resize together).
 */
export function DesktopSidebar({ collapsed }: DesktopSidebarProps) {
  return (
    <aside
      id={SIDEBAR_ID}
      className="fixed inset-y-0 left-0 z-30 hidden w-(--sidebar) flex-col overflow-hidden border-r border-line bg-sidebar px-3 pt-4.5 group-data-[sidebar=collapsed]/shell:px-2 md:flex motion-safe:transition-[width] motion-safe:duration-200"
    >
      {collapsed ? <RailContent /> : <SidebarContent />}
    </aside>
  );
}

type SidebarToggleProps = { collapsed: boolean; onToggle: () => void };

/** Handle centered on the sidebar's edge, in both the full and the rail width. */
export function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  return (
    <Hint text={label} side="right">
      <button
        type="button"
        aria-label={label}
        aria-expanded={!collapsed}
        aria-controls={SIDEBAR_ID}
        onClick={onToggle}
        className="group/toggle fixed top-1/2 left-(--sidebar) z-40 hidden h-12 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[5px] border border-line bg-white shadow-button hover:border-line-strong md:flex motion-safe:transition-[left,translate] motion-safe:duration-200"
      >
        <span
          className="h-4 w-0.5 rounded-full bg-line-strong group-hover/toggle:bg-faint"
          aria-hidden="true"
        />
      </button>
    </Hint>
  );
}

/** Below `md` the sidebar opens as a modal drawer from a menu button in the top bar. */
export function MobileSidebar() {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        className={cn(iconButtonStyles, "shrink-0 md:hidden")}
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/30 motion-safe:data-[state=closed]:animate-fade-out motion-safe:data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-[min(260px,85vw)] flex-col bg-sidebar px-3 pt-4.5 shadow-popover motion-safe:data-[state=closed]:animate-drawer-out motion-safe:data-[state=open]:animate-drawer-in"
        >
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <SidebarContent
            headerAction={
              <Dialog.Close className={iconButtonStyles} aria-label="Close navigation">
                <X size={16} />
              </Dialog.Close>
            }
            inDrawer
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
