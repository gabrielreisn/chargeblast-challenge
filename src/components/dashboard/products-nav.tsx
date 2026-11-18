"use client";
import * as Accordion from "@radix-ui/react-accordion";
import {
  ChartColumn,
  ChevronDown,
  Ellipsis,
  FlaskConical,
  LayoutGrid,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn, navItemHover, navItemLayout, navItemText } from "@/components/ui/styles";
import { UnavailableNavLink } from "./unavailable-nav-link";

type ProductLink = { label: string; preview?: boolean };
type Product = { icon: LucideIcon; label: string; links: ProductLink[] };

export const products: Product[] = [
  {
    icon: Wallet,
    label: "Payments",
    links: [
      { label: "Analytics" },
      { label: "Managed Payments" },
      { label: "Checkout", preview: true },
      { label: "Disputes" },
      { label: "Radar" },
      { label: "Terminal" },
      { label: "Agentic commerce" },
    ],
  },
  {
    icon: ReceiptText,
    label: "Billing",
    links: [
      { label: "Overview" },
      { label: "Subscriptions" },
      { label: "Invoices" },
      { label: "Usage-based" },
      { label: "Revenue recovery" },
      { label: "Retention", preview: true },
    ],
  },
  {
    icon: ChartColumn,
    label: "Reporting",
    links: [
      { label: "Reports" },
      { label: "Custom metrics" },
      { label: "Sigma" },
      { label: "Revenue Recognition" },
      { label: "Data management" },
    ],
  },
  { icon: LayoutGrid, label: "Apps", links: [{ label: "Overview" }] },
  {
    icon: Ellipsis,
    label: "More",
    links: [
      { label: "Link" },
      { label: "Profiles" },
      { label: "Tax" },
      { label: "Connect" },
      { label: "Identity" },
      { label: "Atlas" },
      { label: "Issuing" },
      { label: "Financial Connections" },
      { label: "Capital" },
      { label: "Climate" },
      { label: "Payouts" },
      { label: "Workflows" },
      { label: "Projects" },
    ],
  },
];

/**
 * Products accordion: one product open at a time, Payments first since the dashboard lives
 * there. Sub-pages are reference-only in this demo, so they keep hover feedback but are
 * marked disabled, explain themselves in a tooltip, and never navigate.
 */
export function ProductsNav() {
  return (
    <Accordion.Root type="single" collapsible defaultValue="Payments">
      {products.map(({ icon: Icon, label, links }) => (
        <Accordion.Item key={label} value={label}>
          <Accordion.Header>
            <Accordion.Trigger
              className={cn(
                navItemLayout,
                navItemText,
                navItemHover,
                "group w-full px-2.25 text-left data-[state=open]:text-ink",
              )}
            >
              <Icon size={14} strokeWidth={1.7} aria-hidden="true" />
              {label}
              <ChevronDown
                size={11}
                className="ml-auto group-data-[state=open]:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
                aria-hidden="true"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden motion-safe:data-[state=closed]:animate-accordion-up motion-safe:data-[state=open]:animate-accordion-down">
            <ul className="pb-1">
              {links.map((link) => (
                <li key={link.label}>
                  <UnavailableNavLink
                    className={cn(
                      navItemLayout,
                      navItemText,
                      navItemHover,
                      "w-full cursor-default pr-2.25 pl-8 text-left",
                    )}
                  >
                    {link.label}
                    {link.preview && (
                      <FlaskConical size={11} strokeWidth={1.7} aria-label="Preview" />
                    )}
                  </UnavailableNavLink>
                </li>
              ))}
            </ul>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
