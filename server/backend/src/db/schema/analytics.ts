import { pgTable, varchar, timestamp, uuid, integer, jsonb, decimal, date } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const activityLogsTable = pgTable("activity_logs", {
  log_id: uuid("log_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => usersTable.user_id),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  activity_type: varchar("activity_type", { length: 100 }).notNull(),
  resource_type: varchar("resource_type", { length: 50 }),
  resource_id: uuid("resource_id"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

export const courseAnalyticsTable = pgTable("course_analytics", {
  analytics_id: uuid("analytics_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  total_materials: integer("total_materials").default(0),
  total_theory_materials: integer("total_theory_materials").default(0),
  total_lab_materials: integer("total_lab_materials").default(0),
  total_generated_content: integer("total_generated_content").default(0),
  avg_validation_score: decimal("avg_validation_score", { precision: 5, scale: 2 }),
  total_searches: integer("total_searches").default(0),
  total_chat_sessions: integer("total_chat_sessions").default(0),
  total_community_posts: integer("total_community_posts").default(0),
  active_students: integer("active_students").default(0),
  analytics_date: date("analytics_date").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
export type NewActivityLog = typeof activityLogsTable.$inferInsert;
export type CourseAnalytics = typeof courseAnalyticsTable.$inferSelect;
export type NewCourseAnalytics = typeof courseAnalyticsTable.$inferInsert;
