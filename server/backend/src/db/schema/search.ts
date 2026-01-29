import { pgTable, varchar, timestamp, uuid, integer, text, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const searchQueriesTable = pgTable("search_queries", {
  query_id: uuid("query_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => usersTable.user_id),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  query_text: text("query_text").notNull(),
  query_type: varchar("query_type", { length: 50 }),
  filters: jsonb("filters"),
  results_count: integer("results_count"),
  clicked_results: uuid("clicked_results").array(),
  response_time_ms: integer("response_time_ms"),
  created_at: timestamp("created_at").defaultNow(),
});

export type SearchQuery = typeof searchQueriesTable.$inferSelect;
export type NewSearchQuery = typeof searchQueriesTable.$inferInsert;
