"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
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
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { Hint } from "@/features/payments/ui";
const shortcuts = [
  { icon: ChartNoAxesCombined, label: "Payments analytics" },
  { icon: FileChartColumn, label: "Reports" },
  { icon: Link2, label: "Sigma" },
  { icon: Shield, label: "Radar" },
];
const products = [
  { icon: Link2, label: "Connect" },
  { icon: CreditCard, label: "Payments" },
  { icon: BookOpen, label: "Billing" },
  { icon: FileChartColumn, label: "Reporting" },
  { icon: Ellipsis, label: "More" },
];
function AccountMenu() {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger className="account-switcher">
        <span className="account-logo" aria-hidden="true">
          c
        </span>
        <strong>cramly.ai</strong>
        <ChevronDown size={13} />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className="menu" align="start" sideOffset={6}>
          <Dropdown.Label className="menu-label">Your account</Dropdown.Label>
          <div className="account-info">
            <span className="account-logo" aria-hidden="true">
              c
            </span>
            <span>
              <strong>cramly.ai</strong>
              <small>Demo workspace</small>
            </span>
          </div>
          <Dropdown.Separator className="menu-divider" />
          <Dropdown.Item className="menu-item">
            Sandbox <span className="tiny-label">Active</span>
          </Dropdown.Item>
          <Dropdown.Item asChild>
            <a href="https://dashboard.stripe.com/sandboxes" target="_blank" rel="noreferrer">
              Open Stripe Dashboard <ExternalLink size={13} />
            </a>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
export function DashboardShell({ children, search }: { children: ReactNode; search?: ReactNode }) {
  const [notice, setNotice] = useState(false);
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <AccountMenu />
        <nav aria-label="Main navigation">
          <span className="nav-item unavailable">
            <House />
            Home
          </span>
          <span className="nav-item unavailable">
            <Wallet />
            Balances
          </span>
          <Link className="nav-item current" href="/payments">
            <ArrowDownUp />
            Transactions
          </Link>
          <span className="nav-item unavailable">
            <CircleUserRound />
            Customers
          </span>
          <span className="nav-item unavailable">
            <Layers />
            Product catalog
          </span>
          <div className="nav-section">Shortcuts</div>
          {shortcuts.map(({ icon: Icon, label }) => (
            <span className="nav-item unavailable" key={label}>
              <Icon />
              {label}
            </span>
          ))}
          <div className="nav-section">Products</div>
          {products.map(({ icon: Icon, label }) => (
            <span className="nav-item unavailable" key={label}>
              <Icon />
              {label}
              <ChevronDown className="nav-chevron" />
            </span>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a className="nav-item" href="https://docs.stripe.com" target="_blank" rel="noreferrer">
            <span className="code-icon">&lt;/&gt;</span>Developers <ExternalLink size={11} />
          </a>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          {search ?? (
            <Link href="/payments" className="global-search-placeholder">
              <Search size={13} />
              Search payments
            </Link>
          )}
          <div className="topbar-actions">
            <span className="test-mode">
              Test mode <span className="test-pill">Sandbox</span>
            </span>
            <Hint text="Stripe documentation">
              <a
                className="icon-button"
                href="https://docs.stripe.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Documentation"
              >
                <BookOpen size={15} />
              </a>
            </Hint>
            <Hint text="Demo notifications">
              <button
                className="icon-button"
                onClick={() => setNotice(!notice)}
                aria-label="Notifications"
              >
                <Bell size={15} />
              </button>
            </Hint>
            <Hint text="Help">
              <a
                className="icon-button"
                href="https://docs.stripe.com/payments"
                target="_blank"
                rel="noreferrer"
                aria-label="Help"
              >
                <CircleHelp size={15} />
              </a>
            </Hint>
            <Dropdown.Root>
              <Dropdown.Trigger className="avatar" aria-label="Account menu">
                G
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content className="menu" align="end">
                  <Dropdown.Label className="menu-label">Gabriel · Demo account</Dropdown.Label>
                  <Dropdown.Item asChild>
                    <Link href="/payments">Payments</Link>
                  </Dropdown.Item>
                  <Dropdown.Item asChild>
                    <a
                      href="https://dashboard.stripe.com/sandboxes"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Manage sandbox <Settings size={13} />
                    </a>
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </div>
        </header>
        {notice && (
          <div className="notification">
            <Bell size={15} />
            <span>You’re all caught up. No new notifications in this demo.</span>
            <button
              className="icon-button"
              aria-label="Dismiss notifications"
              onClick={() => setNotice(false)}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <main id="main-content">{children}</main>
        <footer className="workspace-footer">
          <span>
            <span className="live-dot" />
            All systems operational
          </span>
          <span>Sandbox data · No real payments</span>
        </footer>
      </div>
    </div>
  );
}
export function IntroBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="intro-banner">
      <Sparkles size={13} />
      <span>
        <span className="new-label">New</span> Rule Attributes are now in Sigma and Data Pipeline
        for better fraud insights.
      </span>
      <a href="https://docs.stripe.com/radar" target="_blank" rel="noreferrer">
        Get started <ExternalLink size={11} />
      </a>
      <button
        className="icon-button"
        aria-label="Dismiss announcement"
        onClick={() => setVisible(false)}
      >
        <X size={13} />
      </button>
    </div>
  );
}
export function PageHeading() {
  return (
    <>
      <div className="page-heading">
        <h1>Transactions</h1>
        <div className="heading-actions">
          <Hint text="This read-only demo does not create payments">
            <button className="button primary" aria-disabled="true">
              <Plus size={13} />
              Create payment
            </button>
          </Hint>
          <Hint text="Use the filters below to explore payments">
            <button className="button" aria-disabled="true">
              <ChartNoAxesCombined size={13} />
              Analyze
            </button>
          </Hint>
        </div>
      </div>
      <nav className="transaction-tabs" aria-label="Transaction type">
        <Link href="/payments" aria-current="page">
          Payments
        </Link>
        {["Payouts", "Top-ups", "Collected fees", "Transfers", "All activity"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </nav>
    </>
  );
}
