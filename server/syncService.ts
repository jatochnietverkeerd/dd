import { IStorage } from "./storage";
import { InsertVehicle } from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { uploadToCloudinary } from './cloudinaryService';

export class DDCarsSyncService {
  private storage: IStorage;
  private ddcarsBaseUrl: string = 'https://ddcars.nl';
  private uploadsDir: string = path.join(process.cwd(), 'uploads');

  constructor(storage: IStorage) {
    this.storage = storage;
    this.ensureUploadsDir();
  }

  private ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async syncVehiclesFromDDCars(): Promise<{ synced: number; errors: any[] }> {
    console.log('🔄 Starting vehicle sync from ddcars.nl...');
    
    try {
      // Fetch vehicles from ddcars.nl
      const response = await fetch(`${this.ddcarsBaseUrl}/api/vehicles`);
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
      }

      const ddcarsVehicles = await response.json();
      console.log(`📥 Retrieved ${ddcarsVehicles.length} vehicles from ddcars.nl`);

      let syncedCount = 0;
      const errors: any[] = [];

      for (const ddcarsVehicle of ddcarsVehicles) {
        try {
          await this.syncSingleVehicle(ddcarsVehicle);
          syncedCount++;
          console.log(`✅ Synced vehicle: ${ddcarsVehicle.brand} ${ddcarsVehicle.model}`);
        } catch (error: any) {
          console.error(`❌ Failed to sync vehicle ${ddcarsVehicle.id}:`, error);
          errors.push({ vehicleId: ddcarsVehicle.id, error: error?.message || 'Unknown error' });
        }
      }

      console.log(`🎉 Sync completed: ${syncedCount} vehicles synced, ${errors.length} errors`);
      return { synced: syncedCount, errors };
    } catch (error) {
      console.error('💥 Sync failed:', error);
      throw error;
    }
  }

  private async syncSingleVehicle(ddcarsVehicle: any): Promise<void> {
    // Check if vehicle already exists in our database
    const existingVehicles = await this.storage.getVehicles();
    const existingVehicle = existingVehicles.find(v => 
      v.brand === ddcarsVehicle.brand && 
      v.model === ddcarsVehicle.model && 
      v.year === ddcarsVehicle.year
    );

    // Sync images first
    const syncedImages = await this.syncVehicleImages(ddcarsVehicle.images || []);

    // Prepare vehicle data for our schema
    const vehicleData: InsertVehicle = {
      brand: ddcarsVehicle.brand,
      model: ddcarsVehicle.model,
      year: ddcarsVehicle.year,
      price: ddcarsVehicle.price.toString(),
      mileage: ddcarsVehicle.mileage,
      fuel: ddcarsVehicle.fuel,
      transmission: ddcarsVehicle.transmission,
      color: ddcarsVehicle.color,
      description: ddcarsVehicle.description,
      images: syncedImages,
      featured: ddcarsVehicle.featured || false,
      available: ddcarsVehicle.available !== false,
      status: ddcarsVehicle.status || 'beschikbaar'
    };

    if (existingVehicle) {
      // Update existing vehicle
      await this.storage.updateVehicle(existingVehicle.id, vehicleData);
      console.log(`🔄 Updated existing vehicle: ${vehicleData.brand} ${vehicleData.model}`);
    } else {
      // Create new vehicle
      await this.storage.createVehicle(vehicleData);
      console.log(`✨ Created new vehicle: ${vehicleData.brand} ${vehicleData.model}`);
    }
  }

  private async syncVehicleImages(ddcarsImages: string[]): Promise<string[]> {
    const syncedImages: string[] = [];

    for (const imageUrl of ddcarsImages) {
      try {
        const syncedImagePath = await this.downloadAndSaveImage(imageUrl);
        if (syncedImagePath) {
          syncedImages.push(syncedImagePath);
        }
      } catch (error) {
        console.error(`Failed to sync image ${imageUrl}:`, error);
      }
    }

    return syncedImages;
  }

  private async downloadAndSaveImage(imageUrl: string): Promise<string | null> {
    try {
      // Handle relative URLs
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${this.ddcarsBaseUrl}${imageUrl}`;
      
      console.log(`📥 Downloading image: ${fullUrl}`);
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      // Get image buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      const publicId = `synced-${timestamp}-${random}`;
      
      console.log(`☁️ Uploading to Cloudinary: ${publicId}`);
      const cloudinaryResult = await uploadToCloudinary(buffer, 'ddcars-sync', publicId);
      
      console.log(`✅ Uploaded to Cloudinary: ${cloudinaryResult.secure_url}`);
      return cloudinaryResult.secure_url;
    } catch (error) {
      console.error('Image sync failed:', error);
      return null;
    }
  }

  private generateSlug(brand: string, model: string, year: number): string {
    return `${brand}-${model}-${year}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async syncPurchases(): Promise<{ synced: number; errors: any[] }> {
    try {
      const response = await fetch(`${this.ddcarsBaseUrl}/api/admin/purchases`);
      if (!response.ok) {
        throw new Error(`Failed to fetch purchases: ${response.statusText}`);
      }

      const ddcarsPurchases = await response.json();
      // Implementation for purchase sync would go here
      return { synced: 0, errors: [] };
    } catch (error) {
      console.error('Purchase sync failed:', error);
      throw error;
    }
  }

  async syncSales(): Promise<{ synced: number; errors: any[] }> {
    try {
      const response = await fetch(`${this.ddcarsBaseUrl}/api/admin/sales`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sales: ${response.statusText}`);
      }

      const ddcarsSales = await response.json();
      // Implementation for sales sync would go here
      return { synced: 0, errors: [] };
    } catch (error) {
      console.error('Sales sync failed:', error);
      throw error;
    }
  }

  async performFullSync(): Promise<{
    vehicles: { synced: number; errors: any[] };
    purchases: { synced: number; errors: any[] };
    sales: { synced: number; errors: any[] };
  }> {
    console.log('🚀 Starting full DDCars sync...');
    
    const results = {
      vehicles: await this.syncVehiclesFromDDCars(),
      purchases: await this.syncPurchases(),
      sales: await this.syncSales()
    };

    console.log('✅ Full sync completed:', results);
    return results;
  }
}