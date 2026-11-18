import { createStripeClient } from "../src/features/payments/stripe-source.ts";
import { importPayments } from "./import-payments.ts";
// Invoked explicitly only. The SDK never runs in the browser or during a build.
const stripe = createStripeClient(process.env.STRIPE_SECRET_KEY);
const count = await importPayments(stripe);
console.log(`Imported ${count} sandbox payments into data/stripe-payments.local.json.`);
