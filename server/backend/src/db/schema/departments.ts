import { pgTable, varchar, timestamp, uuid, boolean, integer, text } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const departmentsTable = pgTable("departments", {
  department_id: uuid("department_id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  head_of_department: uuid("head_of_department").references(() => usersTable.user_id),
  established_year: integer("established_year"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export type Department = typeof departmentsTable.$inferSelect;
export type NewDepartment = typeof departmentsTable.$inferInsert;
