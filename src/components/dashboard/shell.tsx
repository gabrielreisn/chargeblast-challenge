"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { Bell, BookOpen, CircleHelp, Settings } from "lucide-react";
import { Hint } from "@/components/ui/hint";
import {
  cn,
  desktopIconButtonStyles,
  floatingPanelStyles,
  menuItemStyles,
  menuLabelStyles,
  menuStyles,
} from "@/components/ui/styles";
import { DesktopSidebar, MobileSidebar, SidebarToggle } from "./sidebar";

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

/**
 * `--sidebar-width` is the sidebar's size per breakpoint; `--sidebar` is the space the content
 * reserves for it: 0 below `md` (the drawer overlays), the icon rail's width while collapsed.
 */
export function DashboardShell({ children, search }: DashboardShellProps) {
  // Collapsing is a user preference with no other source of truth; the layout keeps it
  // across navigations because the shell renders once.
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div
      data-sidebar={collapsed ? "collapsed" : "expanded"}
      className="group/shell min-h-screen [--sidebar:0px] md:[--sidebar-width:165px] md:[--sidebar:var(--sidebar-width)] lg:[--sidebar-width:190px] 2xl:[--sidebar-width:210px] md:data-[sidebar=collapsed]:[--sidebar:52px]"
    >
      <DesktopSidebar collapsed={collapsed} />
      <SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="ml-(--sidebar) flex min-h-screen flex-col px-3.75 md:px-5 lg:px-7.5 2xl:px-9.5 motion-safe:transition-[margin] motion-safe:duration-200">
        <header className="flex h-15 items-center justify-between gap-3 md:h-16.5 md:gap-6">
          <MobileSidebar />
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
