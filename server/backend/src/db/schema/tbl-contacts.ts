import { integer, pgTable, varchar, timestamp, serial } from "drizzle-orm/pg-core";
import { companiesTable } from "./tbl-companies";

export const contactsTable = pgTable("contacts", {
  contact_id: serial("contact_id").primaryKey(),
  first_name: varchar("first_name", { length: 50 }).notNull(),
  last_name: varchar("last_name", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  company_id: integer("company_id").references(() => companiesTable.company_id),
  created_at: timestamp("created_at").defaultNow(),
});

export type Contact = typeof contactsTable.$inferSelect;
export type NewContact = typeof contactsTable.$inferInsert;
