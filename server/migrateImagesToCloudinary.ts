import { storage } from "./storage";
import { uploadToCloudinary } from "./cloudinaryService";
import fs from "fs";
import path from "path";

export async function migrateExistingImagesToCloudinary() {
  console.log("🚀 Starting migration of existing images to Cloudinary...");
  
  try {
    // Get all vehicles
    const vehicles = await storage.getVehicles();
    console.log(`📋 Found ${vehicles.length} vehicles to check for images`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const vehicle of vehicles) {
      if (!vehicle.images || vehicle.images.length === 0) {
        console.log(`⏭️  Vehicle ${vehicle.id} (${vehicle.brand} ${vehicle.model}) has no images`);
        continue;
      }
      
      console.log(`🔄 Processing vehicle ${vehicle.id} (${vehicle.brand} ${vehicle.model}) with ${vehicle.images.length} images`);
      
      const newImageUrls: string[] = [];
      
      for (const imageUrl of vehicle.images) {
        try {
          // Skip if already a Cloudinary URL
          if (imageUrl.includes('cloudinary.com')) {
            console.log(`✅ Image already on Cloudinary: ${imageUrl}`);
            newImageUrls.push(imageUrl);
            continue;
          }
          
          // Handle local upload URLs
          if (imageUrl.startsWith('/uploads/')) {
            const filename = path.basename(imageUrl);
            const filePath = path.join(process.cwd(), 'uploads', filename);
            
            if (fs.existsSync(filePath)) {
              console.log(`⬆️  Uploading ${filename} to Cloudinary...`);
              
              const fileBuffer = fs.readFileSync(filePath);
              
              const result = await uploadToCloudinary(fileBuffer, 'ddcars');
              newImageUrls.push(result.secure_url);
              
              console.log(`✅ Successfully uploaded: ${result.secure_url}`);
              migratedCount++;
            } else {
              console.log(`⚠️  File not found: ${filePath}`);
              errorCount++;
            }
          } else {
            // Keep external URLs as-is
            console.log(`⏭️  Keeping external URL: ${imageUrl}`);
            newImageUrls.push(imageUrl);
          }
        } catch (error) {
          console.error(`❌ Failed to upload image ${imageUrl}:`, error);
          errorCount++;
          // Keep original URL on error
          newImageUrls.push(imageUrl);
        }
      }
      
      // Update vehicle with new image URLs
      if (newImageUrls.length !== vehicle.images.length || 
          newImageUrls.some((url, index) => url !== vehicle.images![index])) {
        
        console.log(`🔄 Updating vehicle ${vehicle.id} with new image URLs...`);
        await storage.updateVehicle(vehicle.id, { images: newImageUrls });
        console.log(`✅ Updated vehicle ${vehicle.id} with ${newImageUrls.length} image URLs`);
      }
    }
    
    console.log(`🎉 Migration completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • ${migratedCount} images successfully migrated to Cloudinary`);
    console.log(`   • ${errorCount} images had errors`);
    
    return {
      success: true,
      migratedCount,
      errorCount,
      message: `Migration completed: ${migratedCount} images migrated, ${errorCount} errors`
    };
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Migration failed"
    };
  }
}