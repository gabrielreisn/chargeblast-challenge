import { mkdir, writeFile } from "node:fs/promises";

let seed = 82971;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const names = [
  "Alex Morgan",
  "Sofia Martinez",
  "Oliver Chen",
  "Emma Wilson",
  "Lucas Santos",
  "Isabella Rossi",
  "Noah Patel",
  "Mia Thompson",
  "Gabriel Costa",
  "Amelia Clarke",
  "Ethan Williams",
  "Chloe Martin",
  "Theo Laurent",
  "Lily Anderson",
  "Leo Nakamura",
  "Grace Kim",
  "Benjamin Taylor",
  "Alice Pereira",
  "Henry Davis",
  "Charlotte Brown",
];
const currencies = ["usd", "usd", "usd", "eur", "gbp", "brl", "jpy"];
const statuses = [
  "succeeded",
  "succeeded",
  "succeeded",
  "succeeded",
  "failed",
  "pending",
  "refunded",
];
const brands = ["visa", "mastercard", "amex"];
const now = new Date(process.argv[2] ?? Date.now());
if (Number.isNaN(now.valueOf())) throw new Error("Provide a valid ISO generation date.");
const payments = Array.from({ length: 500 }, (_, i) => {
  const name = names[i % names.length];
  const status = statuses[i % statuses.length];
  const method = i % 13 === 0 ? "ach" : i % 9 === 0 ? "wallet" : "card";
  const currency = currencies[i % currencies.length];
  const amount = Math.round((4 + random() * 450) * (currency === "jpy" ? 120 : 100));
  const hex = Array.from({ length: 24 }, () => Math.floor(random() * 36).toString(36)).join("");
  return {
    id: `pi_3${hex}`,
    customer: {
      id: `cus_demo_${i}`,
      name,
      email: `${name.toLowerCase().replaceAll(" ", ".")}${i > 19 ? i : ""}@example.com`,
    },
    amount,
    currency,
    status,
    sourceStatus:
      status === "refunded"
        ? "succeeded"
        : status === "failed"
          ? "requires_payment_method"
          : status === "pending"
            ? "processing"
            : "succeeded",
    method,
    methodType: method === "ach" ? "us_bank_account" : "card",
    brand: method === "ach" ? null : brands[i % 3],
    last4: String(1000 + Math.floor(random() * 9000)),
    wallet: method === "wallet" ? (i % 2 ? "apple_pay" : "google_pay") : null,
    created:
      Math.floor(now.valueOf() / 1000) - (i < 20 ? i * 1400 : Math.floor(random() * 90 * 86400)),
    amountRefunded: status === "refunded" ? amount : 0,
    description: [
      "Subscription update",
      "Monthly subscription",
      "Invoice payment",
      "Subscription creation",
    ][i % 4],
  };
}).sort((a, b) => b.created - a.created);
await mkdir("data", { recursive: true });
await writeFile(
  "data/payments.fixture.json",
  JSON.stringify(
    { schemaVersion: 1, source: "synthetic", importedAt: now.toISOString(), payments },
    null,
    2,
  ) + "\n",
);
console.log("Generated 500 synthetic payments.");
