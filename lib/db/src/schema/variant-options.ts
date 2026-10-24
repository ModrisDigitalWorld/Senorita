import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

export const variantOptionsTable = pgTable("variant_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  value: text("value").notNull(),
  hex: text("hex"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type VariantOption = typeof variantOptionsTable.$inferSelect;
export type NewVariantOption = typeof variantOptionsTable.$inferInsert;
