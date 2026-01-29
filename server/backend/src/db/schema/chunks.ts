import { pgTable, varchar, timestamp, uuid, integer, text, boolean, customType, jsonb } from "drizzle-orm/pg-core";
import { materialsTable } from "./materials";

// Custom vector type for pgvector extension
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1024)';
  },
});

// Part 2: Intelligent Search Engine (RAG)
export const materialChunksTable = pgTable("material_chunks", {
  chunk_id: uuid("chunk_id").primaryKey().defaultRandom(),
  material_id: uuid("material_id").references(() => materialsTable.material_id, { onDelete: 'cascade' }).notNull(),
  
  // Chunk content
  chunk_text: text("chunk_text").notNull(),
  chunk_order: integer("chunk_order").notNull(),
  chunk_type: varchar("chunk_type", { length: 50 }),  // 'text', 'code', 'table', 'equation', etc.
  
  // Context metadata
  page_number: integer("page_number"),
  line_start: integer("line_start"),
  line_end: integer("line_end"),
  
  // For code chunks
  language: varchar("language", { length: 50 }),
  is_code: boolean("is_code").default(false),
  
  // Rich metadata for better retrieval
  chunk_metadata: jsonb("chunk_metadata"), // Store headers, context, etc.
  vector_id: varchar("vector_id", { length: 255 }), // Pinecone vector ID for tracking
  
  created_at: timestamp("created_at").defaultNow(),
});

export const chunkEmbeddingsTable = pgTable("chunk_embeddings", {
  embedding_id: uuid("embedding_id").primaryKey().defaultRandom(),
  chunk_id: uuid("chunk_id").references(() => materialChunksTable.chunk_id, { onDelete: 'cascade' }).notNull(),
  embedding: vector("embedding"),  // OpenAI ada-002 dimension (1536)
  model: varchar("model", { length: 100 }).default('text-embedding-ada-002'),
  created_at: timestamp("created_at").defaultNow(),
});

export type MaterialChunk = typeof materialChunksTable.$inferSelect;
export type NewMaterialChunk = typeof materialChunksTable.$inferInsert;
export type ChunkEmbedding = typeof chunkEmbeddingsTable.$inferSelect;
export type NewChunkEmbedding = typeof chunkEmbeddingsTable.$inferInsert;
