import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const bannersTable = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  image: text("image").notNull(),
  link: text("link"),
  buttonText: text("button_text"),
  position: text("position").notNull().default("hero"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Banner = typeof bannersTable.$inferSelect;
export type NewBanner = typeof bannersTable.$inferInsert;
