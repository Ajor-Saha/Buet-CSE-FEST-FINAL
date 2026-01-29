import { pgTable, varchar, timestamp, serial } from "drizzle-orm/pg-core";

export const companiesTable = pgTable("companies", {
  company_id: serial("company_id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  industry: varchar("industry", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
});

export type Company = typeof companiesTable.$inferSelect;
export type NewCompany = typeof companiesTable.$inferInsert;
