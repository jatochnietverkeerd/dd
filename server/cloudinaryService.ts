// Set the correct CLOUDINARY_URL before importing the library
process.env.CLOUDINARY_URL = 'cloudinary://361681299372585:yHBKkU3hZOHSvTVtGAoMHa7hYsk@dpqb9lz1i';

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Additional configuration to ensure settings are correct
cloudinary.config({
  cloud_name: 'dpqb9lz1i',
  api_key: '361681299372585',
  api_secret: 'yHBKkU3hZOHSvTVtGAoMHa7hYsk',
  secure: true,
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'ddcars',
  publicId?: string
): Promise<CloudinaryUploadResult> {
  try {
    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary configuration. Please check environment variables.');
    }

    console.log('Cloudinary config check:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY?.substring(0, 5) + '...',
      api_secret_length: process.env.CLOUDINARY_API_SECRET?.length
    });

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadOptions: any = {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          } else {
            reject(new Error('Upload failed: no result'));
          }
        }
      ).end(fileBuffer);
    });

    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error}`);
  }
}

export async function getCloudinaryImages(folder: string = 'ddcars'): Promise<any[]> {
  try {
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();
    
    return result.resources || [];
  } catch (error) {
    console.error('Cloudinary search error:', error);
    return [];
  }
}

export function generateCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  } = {}
): string {
  return cloudinary.url(publicId, {
    secure: true,
    quality: options.quality || 'auto',
    fetch_format: 'auto',
    ...options,
  });
}