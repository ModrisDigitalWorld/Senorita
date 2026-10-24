import { afterAll } from "vitest";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

afterAll(async () => {
  await db.execute(sql`SELECT 1`).catch(() => {});
});
