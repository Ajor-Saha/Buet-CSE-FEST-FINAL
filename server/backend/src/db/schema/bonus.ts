import { pgTable, varchar, timestamp, uuid, integer, text, jsonb, decimal, boolean } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses";
import { usersTable } from "./users";
import { materialsTable } from "./materials";
import { generatedContentTable } from "./generated-content";

// Bonus: Handwritten Notes Digitization
export const digitizedNotesTable = pgTable("digitized_notes", {
  note_id: uuid("note_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  user_id: uuid("user_id").references(() => usersTable.user_id),
  original_image_path: varchar("original_image_path", { length: 500 }).notNull(),
  digitized_content: text("digitized_content"),
  output_format: varchar("output_format", { length: 50 }),
  output_file_path: varchar("output_file_path", { length: 500 }),
  ocr_model: varchar("ocr_model", { length: 100 }),
  processing_status: varchar("processing_status", { length: 50 }),
  quality_score: decimal("quality_score", { precision: 5, scale: 2 }),
  topic: varchar("topic", { length: 255 }),
  week_number: integer("week_number"),
  tags: text("tags").array(),
  created_at: timestamp("created_at").defaultNow(),
  processed_at: timestamp("processed_at"),
});

// Bonus: Content-to-Video Generation
export const generatedVideosTable = pgTable("generated_videos", {
  video_id: uuid("video_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  user_id: uuid("user_id").references(() => usersTable.user_id),
  source_material_id: uuid("source_material_id").references(() => materialsTable.material_id),
  source_generated_id: uuid("source_generated_id").references(() => generatedContentTable.generated_id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  video_path: varchar("video_path", { length: 500 }),
  thumbnail_path: varchar("thumbnail_path", { length: 500 }),
  duration_seconds: integer("duration_seconds"),
  voice_type: varchar("voice_type", { length: 50 }),
  language: varchar("language", { length: 50 }).default('en'),
  include_visuals: boolean("include_visuals").default(true),
  processing_status: varchar("processing_status", { length: 50 }),
  video_generation_model: varchar("video_generation_model", { length: 100 }),
  view_count: integer("view_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  processed_at: timestamp("processed_at"),
});

export type DigitizedNote = typeof digitizedNotesTable.$inferSelect;
export type NewDigitizedNote = typeof digitizedNotesTable.$inferInsert;
export type GeneratedVideo = typeof generatedVideosTable.$inferSelect;
export type NewGeneratedVideo = typeof generatedVideosTable.$inferInsert;
