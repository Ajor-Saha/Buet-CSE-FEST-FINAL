import { pgTable, varchar, timestamp, uuid, boolean, integer, text, bigint } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses";
import { usersTable } from "./users";

export const materialsTable = pgTable("materials", {
  material_id: uuid("material_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id, { onDelete: 'cascade' }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).notNull(),
  content_type: varchar("content_type", { length: 50 }).notNull(),
  file_path: varchar("file_path", { length: 500 }).notNull(),
  file_size_bytes: bigint("file_size_bytes", { mode: 'number' }),
  mime_type: varchar("mime_type", { length: 100 }),
  week_number: integer("week_number"),
  topic: varchar("topic", { length: 255 }),
  tags: text("tags").array(),
  programming_language: varchar("programming_language", { length: 50 }),
  uploaded_by: uuid("uploaded_by").references(() => usersTable.user_id),
  is_public: boolean("is_public").default(true),
  view_count: integer("view_count").default(0),
  download_count: integer("download_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const materialDependenciesTable = pgTable("material_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  material_id: uuid("material_id").references(() => materialsTable.material_id, { onDelete: 'cascade' }).notNull(),
  depends_on_material_id: uuid("depends_on_material_id").references(() => materialsTable.material_id, { onDelete: 'cascade' }).notNull(),
  dependency_type: varchar("dependency_type", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
});

export type Material = typeof materialsTable.$inferSelect;
export type NewMaterial = typeof materialsTable.$inferInsert;
export type MaterialDependency = typeof materialDependenciesTable.$inferSelect;
export type NewMaterialDependency = typeof materialDependenciesTable.$inferInsert;
