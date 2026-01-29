import { pgTable, varchar, uuid, boolean } from "drizzle-orm/pg-core";

export const departmentsTable = pgTable("departments", {
  department_id: uuid("department_id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  is_active: boolean("is_active").default(true),
});

export type Department = typeof departmentsTable.$inferSelect;
export type NewDepartment = typeof departmentsTable.$inferInsert;
