import { pgTable, varchar, timestamp, uuid, text, jsonb, boolean, numeric } from "drizzle-orm/pg-core";
import { generatedContentTable } from "./generated-content";
import { usersTable } from "./users";

// Part 4: Content Validation & Evaluation
export const validationResultsTable = pgTable("validation_results", {
  validation_id: uuid("validation_id").primaryKey().defaultRandom(),
  content_id: uuid("content_id").references(() => generatedContentTable.content_id, { onDelete: 'cascade' }).notNull(),
  
  // Validation type
  validation_type: varchar("validation_type", { length: 50 }).notNull(),  // 'syntax', 'grounding', 'rubric', 'automated_test'
  
  // Results
  is_valid: boolean("is_valid").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }),  // 0-100
  
  // Details
  findings: jsonb("findings"),  // Detailed results, errors, suggestions
  explanation: text("explanation"),
  
  // For code validation
  syntax_errors: jsonb("syntax_errors"),
  test_results: jsonb("test_results"),
  
  validated_by: uuid("validated_by").references(() => usersTable.user_id),  // NULL for automated validation
  validated_at: timestamp("validated_at").defaultNow(),
});

export type ValidationResult = typeof validationResultsTable.$inferSelect;
export type NewValidationResult = typeof validationResultsTable.$inferInsert;
