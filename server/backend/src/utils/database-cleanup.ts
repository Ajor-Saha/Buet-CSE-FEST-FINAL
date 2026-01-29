import { db } from "../db";
import { sql } from "drizzle-orm";
import { 
  votersTable, 
} from "../db/schema";

/**
 * Database cleanup utility function
 * Controls whether to clean database on server startup
 * 
 * @param cleanupFlag - 0: Clean all data, 1: Keep all data
 */


export async function cleanupDatabase(cleanupFlag: number = 0): Promise<void> {
  try {
    if (cleanupFlag === 0) {
      console.log("🗑️  Cleaning database - removing all existing data...");
      
      // Delete all data from tables in reverse dependency order
      await db.delete(votersTable);
      
      console.log("✅ Database cleaned successfully - all data removed");
      
      // Reset auto-increment sequences (SQLite specific)
      // Note: sqlite_sequence table only exists if AUTOINCREMENT columns have been used
      try {
        await db.run(sql`DELETE FROM sqlite_sequence WHERE name IN ('voters')`);
        console.log("✅ Auto-increment sequences reset");
      } catch (sequenceError) {
        // sqlite_sequence table doesn't exist yet, which is fine
        console.log("ℹ️  No auto-increment sequences to reset (table doesn't exist yet)");
      }
      
    } else if (cleanupFlag === 1) {
      console.log("📊 Database cleanup disabled - keeping existing data");
      
      // Optional: Log current data counts
      const voterCount = await db.select().from(votersTable).then(rows => rows.length);
      
      console.log(`ℹ️  Current voter count: ${voterCount}`);
    } else {
      console.log("⚠️  Invalid cleanup flag value. Use 0 to clean or 1 to keep data");
    }
    
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    throw error;
  }
}

/**
 * Configuration for database cleanup
 * Change this value to control cleanup behavior:
 * 0 = Clean all data on startup
 * 1 = Keep all data on startup
 */
export const DATABASE_CLEANUP_FLAG = parseInt(process.env.DB_CLEANUP_FLAG || "0");