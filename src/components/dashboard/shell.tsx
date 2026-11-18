"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import {
  ArrowDownUp,
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  CircleUserRound,
  CreditCard,
  Ellipsis,
  ExternalLink,
  FileChartColumn,
  House,
  Layers,
  Link2,
  Settings,
  Shield,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Hint } from "@/features/payments/ui";
import {
  cn,
  desktopIconButtonStyles,
  floatingPanelStyles,
  menuItemStyles,
  menuLabelStyles,
  menuSeparatorStyles,
  menuStyles,
} from "@/components/ui/styles";

type NavEntry = { icon: LucideIcon; label: string };

const primaryNav: NavEntry[] = [
  { icon: House, label: "Home" },
  { icon: Wallet, label: "Balances" },
];
const secondaryNav: NavEntry[] = [
  { icon: CircleUserRound, label: "Customers" },
  { icon: Layers, label: "Product catalog" },
];
const shortcuts: NavEntry[] = [
  { icon: ChartNoAxesCombined, label: "Payments analytics" },
  { icon: FileChartColumn, label: "Reports" },
  { icon: Link2, label: "Sigma" },
  { icon: Shield, label: "Radar" },
];
const products: NavEntry[] = [
  { icon: Link2, label: "Connect" },
  { icon: CreditCard, label: "Payments" },
  { icon: BookOpen, label: "Billing" },
  { icon: FileChartColumn, label: "Reporting" },
  { icon: Ellipsis, label: "More" },
];

// Layout only; each nav item variant sets its own text size, weight and color.
const navItemLayout =
  "flex min-h-7.25 items-center gap-2.25 rounded-[5px] px-2.25 py-1.5 2xl:min-h-8";
const navItemText = "text-11 font-medium text-[#586577] 2xl:text-12";
const navSectionStyles = "mx-2.25 mt-6.25 mb-1.5 text-10 text-[#8490a0]";

type NavItemProps = NavEntry & { expandable?: boolean };

function UnavailableNavItem({ icon: Icon, label, expandable = false }: NavItemProps) {
  return (
    <span className={cn(navItemLayout, navItemText, "cursor-default")}>
      <Icon size={14} strokeWidth={1.7} aria-hidden="true" />
      {label}
      {expandable && <ChevronDown size={11} className="ml-auto" aria-hidden="true" />}
    </span>
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

function AccountMenu() {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="mb-5.75 flex h-9 w-full items-center gap-2 rounded-[5px] px-1.75 text-left text-13">
        <AccountLogo />
        <strong>cramly.ai</strong>
        <ChevronDown size={13} className="ml-auto text-[#7b8794]" aria-hidden="true" />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className={menuStyles} align="start" sideOffset={6}>
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

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-(--sidebar) flex-col border-r border-line bg-sidebar px-3 pt-4.5 md:flex">
      <AccountMenu />
      <nav aria-label="Main navigation">
        {primaryNav.map((entry) => (
          <UnavailableNavItem key={entry.label} {...entry} />
        ))}
        <Link
          className={cn(
            navItemLayout,
            "bg-brand-soft text-11 font-semibold text-brand 2xl:text-12",
          )}
          href="/payments"
          aria-current="page"
        >
          <ArrowDownUp size={14} strokeWidth={1.7} aria-hidden="true" />
          Transactions
        </Link>
        {secondaryNav.map((entry) => (
          <UnavailableNavItem key={entry.label} {...entry} />
        ))}
        <div className={navSectionStyles}>Shortcuts</div>
        {shortcuts.map((entry) => (
          <UnavailableNavItem key={entry.label} {...entry} />
        ))}
        <div className={navSectionStyles}>Products</div>
        {products.map((entry) => (
          <UnavailableNavItem key={entry.label} {...entry} expandable />
        ))}
      </nav>
      <div className="mt-auto border-t border-line py-2">
        <a
          className={cn(navItemLayout, "text-10 font-medium text-[#586577] hover:bg-[#eef0f4]")}
          href="https://docs.stripe.com"
          target="_blank"
          rel="noreferrer"
        >
          <span className="text-11">&lt;/&gt;</span>Developers
          <ExternalLink size={11} className="ml-auto" aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}

function NotificationsPopover() {
  return (
    <Popover.Root>
      <Hint text="Demo notifications">
        <Popover.Trigger className={desktopIconButtonStyles} aria-label="Notifications">
          <Bell size={15} />
        </Popover.Trigger>
      </Hint>
      <Popover.Portal>
        <Popover.Content
          className={cn(floatingPanelStyles, "flex w-67.5 items-center gap-2.5 p-3 text-[#6e62ab]")}
          align="end"
          sideOffset={8}
        >
          <Bell size={15} aria-hidden="true" />
          You’re all caught up. No new notifications in this demo.
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function UserMenu() {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        className="size-5.75 rounded-full bg-[#7b68da] text-10 font-bold text-white"
        aria-label="Account menu"
      >
        G
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className={menuStyles} align="end">
          <Dropdown.Label className={menuLabelStyles}>Gabriel · Demo account</Dropdown.Label>
          <Dropdown.Item asChild className={menuItemStyles}>
            <Link href="/payments">Payments</Link>
          </Dropdown.Item>
          <Dropdown.Item asChild className={menuItemStyles}>
            <a href="https://dashboard.stripe.com/sandboxes" target="_blank" rel="noreferrer">
              Manage sandbox <Settings size={13} aria-hidden="true" />
            </a>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

type DashboardShellProps = { children: ReactNode; search: ReactNode };

export function DashboardShell({ children, search }: DashboardShellProps) {
  return (
    <div className="min-h-screen [--sidebar:0px] md:[--sidebar:165px] lg:[--sidebar:190px] 2xl:[--sidebar:210px]">
      <Sidebar />
      <div className="ml-(--sidebar) flex min-h-screen flex-col px-3.75 md:px-5 lg:px-7.5 2xl:px-9.5">
        <header className="flex h-15 items-center justify-between gap-3 md:h-16.5 md:gap-6">
          {search}
          <div className="flex items-center gap-2 md:gap-2.5 lg:gap-4">
            <span className="hidden text-10 whitespace-nowrap text-[#657080] lg:inline">
              Test mode
              <span className="ml-1.5 rounded-[3px] border border-[#f4e2bd] bg-[#fff2d8] px-1.25 py-0.5 text-9 text-[#8f6017]">
                Sandbox
              </span>
            </span>
            <Hint text="Stripe documentation">
              <a
                className={desktopIconButtonStyles}
                href="https://docs.stripe.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Documentation"
              >
                <BookOpen size={15} />
              </a>
            </Hint>
            <NotificationsPopover />
            <Hint text="Help">
              <a
                className={desktopIconButtonStyles}
                href="https://docs.stripe.com/payments"
                target="_blank"
                rel="noreferrer"
                aria-label="Help"
              >
                <CircleHelp size={15} />
              </a>
            </Hint>
            <UserMenu />
          </div>
        </header>
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
        <footer className="mt-6.25 flex items-center justify-between gap-2.5 border-t border-[#f1f3f6] py-4 text-8 text-ghost md:text-9">
          <span className="flex items-center gap-1.25">
            <span className="size-1.25 rounded-full bg-[#55aa7a]" aria-hidden="true" />
            All systems operational
          </span>
          <span>Sandbox data · No real payments</span>
        </footer>
      </div>
    </div>
  );
}
