import { pgTable, varchar, timestamp, uuid, boolean, text, jsonb, decimal, integer } from "drizzle-orm/pg-core";
import { generatedContentTable } from "./generated-content";
import { coursesTable } from "./courses";
import { usersTable } from "./users";

export const validationResultsTable = pgTable("validation_results", {
  validation_id: uuid("validation_id").primaryKey().defaultRandom(),
  generated_id: uuid("generated_id").references(() => generatedContentTable.generated_id, { onDelete: 'cascade' }).notNull(),
  validation_type: varchar("validation_type", { length: 50 }).notNull(),
  passed: boolean("passed").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  details: jsonb("details").notNull(),
  errors: text("errors").array(),
  warnings: text("warnings").array(),
  compilation_output: text("compilation_output"),
  test_results: jsonb("test_results"),
  code_coverage: decimal("code_coverage", { precision: 5, scale: 2 }),
  grounding_sources: jsonb("grounding_sources"),
  hallucination_score: decimal("hallucination_score", { precision: 5, scale: 2 }),
  rubric_scores: jsonb("rubric_scores"),
  validator: varchar("validator", { length: 100 }),
  validated_at: timestamp("validated_at").defaultNow(),
});

export const validationRubricsTable = pgTable("validation_rubrics", {
  rubric_id: uuid("rubric_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }),
  criteria: jsonb("criteria").notNull(),
  created_by: uuid("created_by").references(() => usersTable.user_id),
  created_at: timestamp("created_at").defaultNow(),
});

export const testCasesTable = pgTable("test_cases", {
  test_id: uuid("test_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  topic: varchar("topic", { length: 255 }).notNull(),
  programming_language: varchar("programming_language", { length: 50 }).notNull(),
  test_name: varchar("test_name", { length: 255 }).notNull(),
  test_code: text("test_code").notNull(),
  expected_output: text("expected_output"),
  timeout_seconds: integer("timeout_seconds").default(30),
  is_active: boolean("is_active").default(true),
  created_by: uuid("created_by").references(() => usersTable.user_id),
  created_at: timestamp("created_at").defaultNow(),
});

export type ValidationResult = typeof validationResultsTable.$inferSelect;
export type NewValidationResult = typeof validationResultsTable.$inferInsert;
export type ValidationRubric = typeof validationRubricsTable.$inferSelect;
export type NewValidationRubric = typeof validationRubricsTable.$inferInsert;
export type TestCase = typeof testCasesTable.$inferSelect;
export type NewTestCase = typeof testCasesTable.$inferInsert;
