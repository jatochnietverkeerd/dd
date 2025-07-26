import { migrateExistingImagesToCloudinary } from "./server/migrateImagesToCloudinary.js";

async function runMigration() {
  console.log("🚀 Starting direct migration...");
  
  try {
    const result = await migrateExistingImagesToCloudinary();
    console.log("✅ Migration completed:", result);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

runMigration();