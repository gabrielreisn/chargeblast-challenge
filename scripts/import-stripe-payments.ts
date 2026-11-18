import Stripe from "stripe";
import { assertSandboxKey } from "../src/features/payments/normalize.ts";
import { importPayments } from "./import-payments.ts";
// Invoked explicitly only. The SDK never runs in the browser or during a build.
assertSandboxKey(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 3, timeout: 30000 });
const count = await importPayments(stripe);
console.log(`Imported ${count} sandbox payments into data/stripe-payments.local.json.`);
