import fs from 'fs';
import path from 'path';
import { storage } from './storage';

// Simple solution: Copy uploads folder to client/public for static serving
export async function transferImagesToStaticFolder(): Promise<{
  transferred: number;
  updatedVehicles: number;
  errors: string[];
}> {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const publicUploadsDir = path.join(process.cwd(), 'client', 'public', 'uploads');
  
  const errors: string[] = [];
  let transferred = 0;
  let updatedVehicles = 0;

  try {
    // Create public/uploads directory if it doesn't exist
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }

    // Get all image files from uploads
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    console.log(`📁 Transferring ${imageFiles.length} images to static folder...`);

    // Copy each image file
    for (const file of imageFiles) {
      try {
        const sourcePath = path.join(uploadsDir, file);
        const destPath = path.join(publicUploadsDir, file);
        
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(sourcePath, destPath);
          transferred++;
          console.log(`✅ Copied: ${file}`);
        }
      } catch (error) {
        const errorMsg = `Failed to copy ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Update vehicle image URLs in database to use absolute paths
    const vehicles = await storage.getVehicles();
    
    for (const vehicle of vehicles) {
      if (vehicle.images && vehicle.images.length > 0) {
        // Convert relative upload paths to absolute paths that work across domains
        const updatedImages = vehicle.images.map(imageUrl => {
          if (imageUrl.startsWith('/uploads/')) {
            // Keep the same path - it will be served from both /uploads and /client/public/uploads
            return imageUrl;
          }
          return imageUrl;
        });

        if (JSON.stringify(updatedImages) !== JSON.stringify(vehicle.images)) {
          await storage.updateVehicle(vehicle.id, { images: updatedImages });
          updatedVehicles++;
        }
      }
    }

    return { transferred, updatedVehicles, errors };
  } catch (error) {
    console.error('Transfer error:', error);
    throw error;
  }
}

// Ensure both server routes and static files serve uploads
export function setupImageServing(): void {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const publicUploadsDir = path.join(process.cwd(), 'client', 'public', 'uploads');
  
  // Create directories if they don't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  if (!fs.existsSync(publicUploadsDir)) {
    fs.mkdirSync(publicUploadsDir, { recursive: true });
  }
}