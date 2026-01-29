import { pgTable, varchar, timestamp, uuid, boolean, text, jsonb, decimal, integer } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses";
import { usersTable } from "./users";

export const generatedContentTable = pgTable("generated_content", {
  generated_id: uuid("generated_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  user_id: uuid("user_id").references(() => usersTable.user_id),
  prompt: text("prompt").notNull(),
  topic: varchar("topic", { length: 255 }),
  category: varchar("category", { length: 20 }).notNull(),
  content_type: varchar("content_type", { length: 50 }).notNull(),
  content: text("content"),
  file_path: varchar("file_path", { length: 500 }),
  has_images: boolean("has_images").default(false),
  has_diagrams: boolean("has_diagrams").default(false),
  programming_language: varchar("programming_language", { length: 50 }),
  includes_tests: boolean("includes_tests").default(false),
  source_materials: uuid("source_materials").array(),
  external_sources: jsonb("external_sources"),
  model_used: varchar("model_used", { length: 100 }),
  model_parameters: jsonb("model_parameters"),
  generation_metadata: jsonb("generation_metadata"),
  is_validated: boolean("is_validated").default(false),
  validation_score: decimal("validation_score", { precision: 5, scale: 2 }),
  is_public: boolean("is_public").default(false),
  is_bookmarked: boolean("is_bookmarked").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const generatedContentSectionsTable = pgTable("generated_content_sections", {
  section_id: uuid("section_id").primaryKey().defaultRandom(),
  generated_id: uuid("generated_id").references(() => generatedContentTable.generated_id, { onDelete: 'cascade' }).notNull(),
  section_order: integer("section_order").notNull(),
  section_title: varchar("section_title", { length: 255 }),
  section_content: text("section_content"),
  section_type: varchar("section_type", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
});

export type GeneratedContent = typeof generatedContentTable.$inferSelect;
export type NewGeneratedContent = typeof generatedContentTable.$inferInsert;
export type GeneratedContentSection = typeof generatedContentSectionsTable.$inferSelect;
export type NewGeneratedContentSection = typeof generatedContentSectionsTable.$inferInsert;
