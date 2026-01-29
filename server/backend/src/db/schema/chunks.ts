import { pgTable, varchar, timestamp, uuid, integer, text, jsonb } from "drizzle-orm/pg-core";
import { materialsTable } from "./materials";

export const materialChunksTable = pgTable("material_chunks", {
  chunk_id: uuid("chunk_id").primaryKey().defaultRandom(),
  material_id: uuid("material_id").references(() => materialsTable.material_id, { onDelete: 'cascade' }).notNull(),
  chunk_index: integer("chunk_index").notNull(),
  chunk_text: text("chunk_text").notNull(),
  chunk_type: varchar("chunk_type", { length: 50 }),
  code_language: varchar("code_language", { length: 50 }),
  code_context: jsonb("code_context"),
  page_number: integer("page_number"),
  start_position: integer("start_position"),
  end_position: integer("end_position"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

// Note: pgvector extension is needed for this table
// You'll need to install @neondatabase/serverless or use a custom type
export const chunkEmbeddingsTable = pgTable("chunk_embeddings", {
  embedding_id: uuid("embedding_id").primaryKey().defaultRandom(),
  chunk_id: uuid("chunk_id").references(() => materialChunksTable.chunk_id, { onDelete: 'cascade' }).notNull(),
  // embedding: vector("embedding", { dimensions: 1536 }), // Uncomment when pgvector is set up
  embedding_model: varchar("embedding_model", { length: 100 }).default('text-embedding-ada-002'),
  created_at: timestamp("created_at").defaultNow(),
});

export type MaterialChunk = typeof materialChunksTable.$inferSelect;
export type NewMaterialChunk = typeof materialChunksTable.$inferInsert;
export type ChunkEmbedding = typeof chunkEmbeddingsTable.$inferSelect;
export type NewChunkEmbedding = typeof chunkEmbeddingsTable.$inferInsert;
