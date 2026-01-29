import { pgTable, varchar, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  user_id: uuid("user_id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  avatar_url: varchar("avatar_url", { length: 500 }),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
