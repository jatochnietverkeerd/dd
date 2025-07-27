import multer from 'multer';

// Lazy-loaded Cloudinary instance
let cloudinary: any = null;

async function getCloudinary() {
  if (!cloudinary) {
    // Clear any malformed environment variable
    delete process.env.CLOUDINARY_URL;
    
    // Set correct environment variable
    process.env.CLOUDINARY_URL = 'cloudinary://361681299372585:yHBKkU3hZOHSvTVtGAoMHa7hYsk@dpqb9lz1i';
    
    // Import and configure Cloudinary
    const { v2 } = await import('cloudinary');
    
    v2.config({
      cloud_name: 'dpqb9lz1i',
      api_key: '361681299372585',
      api_secret: 'yHBKkU3hZOHSvTVtGAoMHa7hYsk',
      secure: true,
    });
    
    cloudinary = v2;
  }
  return cloudinary;
}

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
    const cloudinary = await getCloudinary();
    
    console.log('Cloudinary upload starting for folder:', folder);

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
        (error: any, result: any) => {
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
    const cloudinary = await getCloudinary();
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error}`);
  }
}

export async function getCloudinaryImages(folder: string = 'ddcars'): Promise<any[]> {
  try {
    const cloudinary = await getCloudinary();
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

export async function generateCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  } = {}
): Promise<string> {
  const cloudinary = await getCloudinary();
  return cloudinary.url(publicId, {
    secure: true,
    quality: options.quality || 'auto',
    fetch_format: 'auto',
    ...options,
  });
}