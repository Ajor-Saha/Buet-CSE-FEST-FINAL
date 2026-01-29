import { pgTable, varchar, timestamp, uuid, integer, text, bigint, boolean } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses";
import { usersTable } from "./users";

// Part 1: Content Management System (CMS)
export const materialsTable = pgTable("materials", {
  material_id: uuid("material_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id, { onDelete: 'cascade' }).notNull(),
  
  // Theory or Lab categorization
  category: varchar("category", { length: 20 }).notNull(),  // 'theory' or 'lab'
  material_type: varchar("material_type", { length: 50 }).notNull(),  // 'slides', 'pdf', 'code', 'notes', 'video', 'other'
  
  // Metadata
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  topic: varchar("topic", { length: 255 }),
  week_number: integer("week_number"),
  tags: text("tags").array(),
  
  // File info
  file_url: varchar("file_url", { length: 500 }),
  file_name: varchar("file_name", { length: 255 }),
  file_size: bigint("file_size", { mode: 'number' }),
  mime_type: varchar("mime_type", { length: 100 }),
  
  // Analytics
  view_count: integer("view_count").default(0),
  download_count: integer("download_count").default(0),
  
  // RAG Indexing Status
  is_indexed: boolean("is_indexed").default(false),
  indexed_at: timestamp("indexed_at"),
  vector_count: integer("vector_count").default(0),
  chunk_count: integer("chunk_count").default(0),
  
  uploaded_by: uuid("uploaded_by").references(() => usersTable.user_id),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
});

export type Material = typeof materialsTable.$inferSelect;
export type NewMaterial = typeof materialsTable.$inferInsert;
