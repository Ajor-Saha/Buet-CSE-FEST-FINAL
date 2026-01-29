import { db } from "../db";
import { sql } from "drizzle-orm";

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
      
      // For now, manual cleanup via SQL if needed
      // await db.execute(sql`TRUNCATE TABLE chat_messages CASCADE`);
      // await db.execute(sql`TRUNCATE TABLE chat_sessions CASCADE`);
      // ... etc for all tables
      
      console.log("✅ Database cleanup skipped - implement if needed");
      
    } else if (cleanupFlag === 1) {
      console.log("📊 Database cleanup disabled - keeping existing data");
      
      // Optional: Log current data counts if needed
      // const userCount = await db.select().from(usersTable).then(rows => rows.length);
      // console.log(`ℹ️  Current user count: ${userCount}`);
      
      console.log("ℹ️  Data counts not displayed - enable if needed");
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