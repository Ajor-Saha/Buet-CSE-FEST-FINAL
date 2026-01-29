import { pgTable, varchar, timestamp, uuid, boolean, integer, text } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { departmentsTable } from "./departments";

export const coursesTable = pgTable("courses", {
  course_id: uuid("course_id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  department_id: uuid("department_id").references(() => departmentsTable.department_id, { onDelete: 'set null' }),
  semester: varchar("semester", { length: 50 }),
  year: integer("year"),
  has_theory: boolean("has_theory").default(true),
  has_lab: boolean("has_lab").default(false),
  total_weeks: integer("total_weeks").default(16),
  created_by: uuid("created_by").references(() => usersTable.user_id),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const enrollmentsTable = pgTable("enrollments", {
  enrollment_id: uuid("enrollment_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid("user_id").references(() => usersTable.user_id, { onDelete: 'cascade' }).notNull(),
  enrolled_at: timestamp("enrolled_at").defaultNow(),
});

export type Course = typeof coursesTable.$inferSelect;
export type NewCourse = typeof coursesTable.$inferInsert;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type NewEnrollment = typeof enrollmentsTable.$inferInsert;
