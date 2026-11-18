import "server-only";
import { readFile } from "node:fs/promises";
import fixture from "../../data/payments.fixture.json";
import { snapshotSchema } from "@/features/payments/model";

export async function getPaymentsData() {
  if (process.env.NODE_ENV === "development") {
    try {
      const content = await readFile(`${process.cwd()}/data/stripe-payments.local.json`, "utf8");
      return snapshotSchema.parse(JSON.parse(content));
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  return snapshotSchema.parse(fixture);
}
