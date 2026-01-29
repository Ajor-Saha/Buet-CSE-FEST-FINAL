import { pgTable, varchar, timestamp, uuid, integer, text, jsonb, decimal, boolean } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses";
import { usersTable } from "./users";

export const communityPostsTable = pgTable("community_posts", {
  post_id: uuid("post_id").primaryKey().defaultRandom(),
  course_id: uuid("course_id").references(() => coursesTable.course_id),
  user_id: uuid("user_id").references(() => usersTable.user_id),
  parent_post_id: uuid("parent_post_id").references((): any => communityPostsTable.post_id),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  post_type: varchar("post_type", { length: 50 }),
  topic: varchar("topic", { length: 255 }),
  tags: text("tags").array(),
  category: varchar("category", { length: 20 }),
  is_resolved: boolean("is_resolved").default(false),
  is_pinned: boolean("is_pinned").default(false),
  upvotes: integer("upvotes").default(0),
  view_count: integer("view_count").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const botRepliesTable = pgTable("bot_replies", {
  reply_id: uuid("reply_id").primaryKey().defaultRandom(),
  post_id: uuid("post_id").references(() => communityPostsTable.post_id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  grounding_materials: uuid("grounding_materials").array(),
  grounding_chunks: uuid("grounding_chunks").array(),
  external_sources: jsonb("external_sources"),
  confidence_score: decimal("confidence_score", { precision: 5, scale: 2 }),
  bot_model: varchar("bot_model", { length: 100 }),
  generation_metadata: jsonb("generation_metadata"),
  is_helpful: boolean("is_helpful"),
  user_feedback: text("user_feedback"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

export const postReactionsTable = pgTable("post_reactions", {
  reaction_id: uuid("reaction_id").primaryKey().defaultRandom(),
  post_id: uuid("post_id").references(() => communityPostsTable.post_id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid("user_id").references(() => usersTable.user_id, { onDelete: 'cascade' }).notNull(),
  reaction_type: varchar("reaction_type", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
});

export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type NewCommunityPost = typeof communityPostsTable.$inferInsert;
export type BotReply = typeof botRepliesTable.$inferSelect;
export type NewBotReply = typeof botRepliesTable.$inferInsert;
export type PostReaction = typeof postReactionsTable.$inferSelect;
export type NewPostReaction = typeof postReactionsTable.$inferInsert;
