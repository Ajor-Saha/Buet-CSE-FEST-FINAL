import { pgTable, varchar, timestamp, uuid, text, boolean, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { coursesTable } from "./courses";
import { generatedContentTable } from "./generated-content";

// Part 5: Conversational Chat Interface
export const chatSessionsTable = pgTable("chat_sessions", {
  session_id: uuid("session_id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => usersTable.user_id, { onDelete: 'cascade' }).notNull(),
  course_id: uuid("course_id").references(() => coursesTable.course_id, { onDelete: 'set null' }),
  title: varchar("title", { length: 255 }),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  last_activity: timestamp("last_activity").defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  message_id: uuid("message_id").primaryKey().defaultRandom(),
  session_id: uuid("session_id").references(() => chatSessionsTable.session_id, { onDelete: 'cascade' }).notNull(),
  
  // Message details
  role: varchar("role", { length: 20 }).notNull(),  // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  
  // AI context tracking
  retrieved_chunks: uuid("retrieved_chunks").array(),  // Chunks used for RAG
  generated_content_id: uuid("generated_content_id").references(() => generatedContentTable.content_id),
  model: varchar("model", { length: 100 }),
  
  // Message metadata
  tokens_used: integer("tokens_used"),
  created_at: timestamp("created_at").defaultNow(),
});

export type ChatSession = typeof chatSessionsTable.$inferSelect;
export type NewChatSession = typeof chatSessionsTable.$inferInsert;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type NewChatMessage = typeof chatMessagesTable.$inferInsert;
