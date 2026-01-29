import { pgTable, varchar, timestamp, uuid, boolean, text, jsonb, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { coursesTable } from "./courses";
import { generatedContentTable } from "./generated-content";

export const chatSessionsTable = pgTable("chat_sessions", {
  session_id: uuid("session_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => usersTable.user_id),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  title: varchar("title", { length: 255 }),
  is_active: boolean("is_active").default(true),
  started_at: timestamp("started_at").defaultNow(),
  last_activity_at: timestamp("last_activity_at").defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  message_id: uuid("message_id").primaryKey().defaultRandom(),
  session_id: uuid("session_id").references(() => chatSessionsTable.session_id, { onDelete: 'cascade' }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  context_materials: uuid("context_materials").array(),
  grounding_chunks: uuid("grounding_chunks").array(),
  generated_content_id: uuid("generated_content_id").references(() => generatedContentTable.generated_id),
  action_type: varchar("action_type", { length: 50 }),
  action_metadata: jsonb("action_metadata"),
  user_rating: integer("user_rating"),
  user_feedback: text("user_feedback"),
  created_at: timestamp("created_at").defaultNow(),
});

export type ChatSession = typeof chatSessionsTable.$inferSelect;
export type NewChatSession = typeof chatSessionsTable.$inferInsert;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type NewChatMessage = typeof chatMessagesTable.$inferInsert;
