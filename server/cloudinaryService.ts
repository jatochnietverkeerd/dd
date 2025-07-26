import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary - will use environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test configuration function
export function testCloudinaryConfig(): { configured: boolean, missing: string[] } {
  const missing: string[] = [];
  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
  
  console.log('Cloudinary config test:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'missing',
    api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'set (length: ' + (process.env.CLOUDINARY_API_SECRET?.length || 0) + ')' : 'missing'
  });
  
  return {
    configured: missing.length === 0,
    missing
  };
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
}

export async function uploadImageToCloudinary(
  localPath: string, 
  folder: string = 'ddcars'
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: folder,
      transformation: [
        { width: 1600, height: 1200, crop: 'limit', quality: 'auto:good' }
      ],
      resource_type: 'image'
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error}`);
  }
}

export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error}`);
  }
}

export function extractPublicIdFromUrl(cloudinaryUrl: string): string | null {
  const match = cloudinaryUrl.match(/\/v\d+\/(.+)\./);
  return match ? match[1] : null;
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

// Migration function to upload existing local images to Cloudinary
export async function migrateLocalImagesToCloudinary(uploadsDir: string): Promise<{
  migrations: Array<{ oldUrl: string, newUrl: string }>,
  errors: Array<{ file: string, error: string }>
}> {
  const migrations: Array<{ oldUrl: string, newUrl: string }> = [];
  const errors: Array<{ file: string, error: string }> = [];

  try {
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );

    console.log(`🔄 Migrating ${imageFiles.length} images to Cloudinary...`);

    for (const file of imageFiles) {
      try {
        const localPath = path.join(uploadsDir, file);
        const oldUrl = `/uploads/${file}`;
        
        const result = await uploadImageToCloudinary(localPath);
        migrations.push({
          oldUrl,
          newUrl: result.secure_url
        });

        console.log(`✅ Migrated: ${file} -> ${result.secure_url}`);
      } catch (error) {
        errors.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`❌ Failed to migrate ${file}:`, error);
      }
    }

    return { migrations, errors };
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}