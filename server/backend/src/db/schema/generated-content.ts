import { pgTable, varchar, timestamp, uuid, text, jsonb, integer } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses";
import { usersTable } from "./users";

// Part 3: AI-Generated Learning Materials
export const generatedContentTable = pgTable("generated_content", {
  content_id: uuid("content_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id, { onDelete: 'cascade' }).notNull(),
  
  // Generated content details
  category: varchar("category", { length: 20 }).notNull(),  // 'theory' or 'lab'
  content_type: varchar("content_type", { length: 50 }).notNull(),  // 'notes', 'slides', 'code', 'summary', etc.
  title: varchar("title", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }),
  week_number: integer("week_number"),
  
  // Content
  content: text("content").notNull(),
  formatted_content: jsonb("formatted_content"),  // For structured output (slides, etc.)
  
  // Generation context
  prompt: text("prompt"),
  source_material_ids: uuid("source_material_ids").array(),  // Materials used for generation
  external_sources: text("external_sources").array(),  // MCP sources (Wikipedia, etc.)
  ai_model: varchar("ai_model", { length: 100 }),
  
  // Status
  status: varchar("status", { length: 50 }).default('draft'),  // 'draft', 'validated', 'published', 'rejected'
  
  generated_by: uuid("generated_by").references(() => usersTable.user_id),
  generated_at: timestamp("generated_at").defaultNow(),
});

export type GeneratedContent = typeof generatedContentTable.$inferSelect;
export type NewGeneratedContent = typeof generatedContentTable.$inferInsert;
