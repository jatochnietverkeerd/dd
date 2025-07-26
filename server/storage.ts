import { vehicles, contacts, users, adminSessions, reservations, purchases, sales, type Vehicle, type InsertVehicle, type Contact, type InsertContact, type User, type InsertUser, type AdminSession, type InsertAdminSession, type Reservation, type InsertReservation, type Purchase, type InsertPurchase, type Sale, type InsertSale } from "@shared/schema";
import { generateSlug, generateUniqueSlug, generateMetaTitle, generateMetaDescription } from "@shared/utils";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehiclesByStatus(status?: string): Promise<Vehicle[]>;
  getFeaturedVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: number): Promise<Vehicle | undefined>;
  getVehicleBySlug(slug: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Admin session operations
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(token: string): Promise<AdminSession | undefined>;
  deleteAdminSession(token: string): Promise<boolean>;
  cleanExpiredSessions(): Promise<void>;
  
  // Reservation operations
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getReservations(): Promise<Reservation[]>;
  getReservationsByVehicle(vehicleId: number): Promise<Reservation[]>;
  updateReservation(id: number, updates: Partial<InsertReservation>): Promise<Reservation | undefined>;
  
  // Purchase operations
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchases(): Promise<Purchase[]>;
  getPurchaseByVehicleId(vehicleId: number): Promise<Purchase | undefined>;
  updatePurchase(id: number, updates: Partial<InsertPurchase>): Promise<Purchase | undefined>;
  deletePurchase(id: number): Promise<boolean>;
  
  // Sale operations
  createSale(sale: InsertSale): Promise<Sale>;
  getSales(): Promise<Sale[]>;
  getSaleByVehicleId(vehicleId: number): Promise<Sale | undefined>;
  updateSale(id: number, updates: Partial<InsertSale>): Promise<Sale | undefined>;
  deleteSale(id: number): Promise<boolean>;
  
  // Financial reports
  getFinancialOverview(year?: number, month?: number): Promise<{
    totalRevenue: number;
    totalPurchases: number;
    totalProfit: number;
    vatCollected: number;
    vehiclesSold: number;
    vehiclesPurchased: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize in constructor, do it lazily
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeData();
    }
    
    await this.initializationPromise;
  }

  private async initializeData() {
    try {
      console.log("Initializing database data...");
      
      // Check if admin user exists
      const adminExists = await db.select().from(users).where(eq(users.username, "ddcars")).limit(1);
      if (adminExists.length === 0) {
        await db.insert(users).values({
          username: "ddcars",
          password: "DD44carstore",
          role: "admin"
        });
        console.log("Primary admin user created");
      }

      // Check if secondary admin user exists
      const secondaryAdminExists = await db.select().from(users).where(eq(users.username, "dd.cars@hotmail.com")).limit(1);
      if (secondaryAdminExists.length === 0) {
        await db.insert(users).values({
          username: "dd.cars@hotmail.com",
          password: "Versace44!",
          role: "admin"
        });
        console.log("Secondary admin user created");
      }

      // Check if vehicles exist
      const vehicleCount = await db.select({ count: sql`count(*)` }).from(vehicles);
      if (Number(vehicleCount[0].count) === 0) {
        // Insert sample vehicles
        await db.insert(vehicles).values([
          {
            brand: "Volkswagen",
            model: "Polo GTI",
            year: 2025,
            price: 33000,
            mileage: 17000,
            fuel: "benzine",
            transmission: "automaat",
            color: "wit",
            description: "Volkswagen Polo GTI 2025 in perfecte staat. Deze compacte sportwagen biedt de perfecte combinatie van stijl, prestaties en betrouwbaarheid. Met slechts 17.000 km op de teller is deze auto nog bijna nieuw.",
            images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1000&auto=format&fit=crop"],
            featured: true,
            available: true,
            availableDate: new Date(),
            status: "beschikbaar",
            slug: generateSlug("Volkswagen", "Polo GTI", 2025),
            metaTitle: generateMetaTitle("Volkswagen", "Polo GTI", 2025, 33000),
            metaDescription: generateMetaDescription("Volkswagen", "Polo GTI", 2025, 17000, "benzine", "automaat")
          },
          {
            brand: "Volkswagen",
            model: "Golf R line",
            year: 2025,
            price: 38000,
            mileage: 12000,
            fuel: "hybrid",
            transmission: "automaat",
            color: "wit",
            description: "Volkswagen Golf R line 2025 met hybride technologie. Deze moderne auto combineert sportiviteit met zuinigheid. Volledig onderhouden en in uitstekende staat.",
            images: ["https://images.unsplash.com/photo-1606016247627-e6b9c8b7d0f1?q=80&w=1000&auto=format&fit=crop"],
            featured: true,
            available: true,
            availableDate: new Date(),
            status: "beschikbaar",
            slug: generateSlug("Volkswagen", "Golf R line", 2025),
            metaTitle: generateMetaTitle("Volkswagen", "Golf R line", 2025, 38000),
            metaDescription: generateMetaDescription("Volkswagen", "Golf R line", 2025, 12000, "hybrid", "automaat")
          },
          {
            brand: "Mercedes-Benz",
            model: "A35 AMG",
            year: 2024,
            price: 42900,
            mileage: 8500,
            fuel: "benzine",
            transmission: "automaat",
            color: "grijs",
            description: "Mercedes-Benz A35 AMG 2024 met 306 PK en vierwielaandrijving. Deze premium hot hatch combineert luxe met prestaties. Volledig onderhouden en in perfecte staat.",
            images: ["https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1000&auto=format&fit=crop"],
            featured: true,
            available: true,
            availableDate: new Date(),
            status: "beschikbaar",
            slug: generateSlug("Mercedes-Benz", "A35 AMG", 2024),
            metaTitle: generateMetaTitle("Mercedes-Benz", "A35 AMG", 2024, 42900),
            metaDescription: generateMetaDescription("Mercedes-Benz", "A35 AMG", 2024, 8500, "benzine", "automaat")
          }
        ]);
        console.log("Sample vehicles created");
      }
      
      this.initialized = true;
      console.log("Database initialization completed");
    } catch (error) {
      console.error("Database initialization error:", error);
      throw error;
    }
  }

  async getVehicles(): Promise<Vehicle[]> {
    await this.ensureInitialized();
    return await db.select().from(vehicles).orderBy(desc(vehicles.id));
  }

  async getVehiclesByStatus(status?: string): Promise<Vehicle[]> {
    await this.ensureInitialized();
    if (status) {
      return await db.select().from(vehicles).where(eq(vehicles.status, status)).orderBy(desc(vehicles.id));
    }
    return await this.getVehicles();
  }

  async getFeaturedVehicles(): Promise<Vehicle[]> {
    await this.ensureInitialized();
    return await db.select().from(vehicles).where(eq(vehicles.featured, true)).orderBy(desc(vehicles.id));
  }

  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    return result[0];
  }

  async getVehicleBySlug(slug: string): Promise<Vehicle | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(vehicles).where(eq(vehicles.slug, slug)).limit(1);
    return result[0];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    await this.ensureInitialized();
    
    // Create a function to check if slug exists
    const checkSlugExists = async (slug: string): Promise<boolean> => {
      const existing = await db.select().from(vehicles).where(eq(vehicles.slug, slug)).limit(1);
      return existing.length > 0;
    };
    
    // Generate a unique slug
    const slug = await generateUniqueSlug(insertVehicle.brand, insertVehicle.model, insertVehicle.year, checkSlugExists);
    const metaTitle = generateMetaTitle(insertVehicle.brand, insertVehicle.model, insertVehicle.year, insertVehicle.price);
    const metaDescription = generateMetaDescription(insertVehicle.brand, insertVehicle.model, insertVehicle.year, insertVehicle.mileage, insertVehicle.fuel, insertVehicle.transmission);

    const [vehicle] = await db.insert(vehicles).values({
      ...insertVehicle,
      slug,
      metaTitle,
      metaDescription,
      availableDate: new Date(),
      available: true
    }).returning();

    return vehicle;
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db.update(vehicles).set(vehicleUpdate).where(eq(vehicles.id, id)).returning();
    return vehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values({
      ...insertContact,
      phone: insertContact.phone || null,
      createdAt: new Date()
    }).returning();
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.id));
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      role: insertUser.role || "user"
    }).returning();
    return user;
  }

  async createAdminSession(sessionData: InsertAdminSession): Promise<AdminSession> {
    const [session] = await db.insert(adminSessions).values(sessionData).returning();
    return session;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const result = await db.select().from(adminSessions).where(eq(adminSessions.sessionToken, token)).limit(1);
    return result[0];
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    const result = await db.delete(adminSessions).where(eq(adminSessions.sessionToken, token));
    return (result.rowCount || 0) > 0;
  }

  async cleanExpiredSessions(): Promise<void> {
    await db.delete(adminSessions).where(sql`${adminSessions.expiresAt} < ${new Date()}`);
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const [reservation] = await db.insert(reservations).values({
      ...insertReservation,
      createdAt: new Date(),
      status: insertReservation.status || "pending",
      stripePaymentIntentId: insertReservation.stripePaymentIntentId || null,
      notes: insertReservation.notes || null
    }).returning();
    return reservation;
  }

  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations).orderBy(desc(reservations.id));
  }

  async getReservationsByVehicle(vehicleId: number): Promise<Reservation[]> {
    return await db.select().from(reservations).where(eq(reservations.vehicleId, vehicleId));
  }

  async updateReservation(id: number, updates: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const [reservation] = await db.update(reservations).set(updates).where(eq(reservations.id, id)).returning();
    return reservation;
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db.insert(purchases).values({
      ...insertPurchase,
      createdAt: new Date(),
      notes: insertPurchase.notes || null,
      vatAmount: insertPurchase.vatAmount || null,
      bpmAmount: insertPurchase.bpmAmount || null,
      transportCost: insertPurchase.transportCost || null,
      maintenanceCost: insertPurchase.maintenanceCost || null,
      cleaningCost: insertPurchase.cleaningCost || null,
      guaranteeCost: insertPurchase.guaranteeCost || null,
      otherCosts: insertPurchase.otherCosts || null
    }).returning();
    return purchase;
  }

  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases).orderBy(desc(purchases.id));
  }

  async getPurchaseByVehicleId(vehicleId: number): Promise<Purchase | undefined> {
    const result = await db.select().from(purchases).where(eq(purchases.vehicleId, vehicleId)).limit(1);
    return result[0];
  }

  async updatePurchase(id: number, updates: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const [purchase] = await db.update(purchases).set(updates).where(eq(purchases.id, id)).returning();
    return purchase;
  }

  async deletePurchase(id: number): Promise<boolean> {
    const result = await db.delete(purchases).where(eq(purchases.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const [sale] = await db.insert(sales).values({
      ...insertSale,
      notes: insertSale.notes || null,
      vatAmount: insertSale.vatAmount || null,
      discount: insertSale.discount || null,
      warrantyMonths: insertSale.warrantyMonths || null,
      deliveryDate: insertSale.deliveryDate || null
    }).returning();
    return sale;
  }

  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.id));
  }

  async getSaleByVehicleId(vehicleId: number): Promise<Sale | undefined> {
    const result = await db.select().from(sales).where(eq(sales.vehicleId, vehicleId)).limit(1);
    return result[0];
  }

  async updateSale(id: number, updates: Partial<InsertSale>): Promise<Sale | undefined> {
    const [sale] = await db.update(sales).set(updates).where(eq(sales.id, id)).returning();
    return sale;
  }

  async deleteSale(id: number): Promise<boolean> {
    const result = await db.delete(sales).where(eq(sales.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getFinancialOverview(year?: number, month?: number): Promise<{
    totalRevenue: number;
    totalPurchases: number;
    totalProfit: number;
    vatCollected: number;
    vehiclesSold: number;
    vehiclesPurchased: number;
  }> {
    let conditions = [];
    
    if (year) {
      conditions.push(sql`EXTRACT(year FROM ${sales.createdAt}) = ${year}`);
    }
    if (month) {
      conditions.push(sql`EXTRACT(month FROM ${sales.createdAt}) = ${month}`);
    }

    const salesData = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${sales.salePriceInclVat} AS NUMERIC)), 0)`,
        totalVat: sql<number>`COALESCE(SUM(CAST(${sales.vatAmount} AS NUMERIC)), 0)`,
        totalProfit: sql<number>`COALESCE(SUM(CAST(${sales.profitInclVat} AS NUMERIC)), 0)`,
        vehiclesSold: sql<number>`COUNT(*)`
      })
      .from(sales)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const purchaseConditions = [];
    if (year) {
      purchaseConditions.push(sql`EXTRACT(year FROM ${purchases.createdAt}) = ${year}`);
    }
    if (month) {
      purchaseConditions.push(sql`EXTRACT(month FROM ${purchases.createdAt}) = ${month}`);
    }

    const purchaseData = await db
      .select({
        totalPurchases: sql<number>`COALESCE(SUM(CAST(${purchases.totalCostInclVat} AS NUMERIC)), 0)`,
        vehiclesPurchased: sql<number>`COUNT(*)`
      })
      .from(purchases)
      .where(purchaseConditions.length > 0 ? and(...purchaseConditions) : undefined);

    return {
      totalRevenue: Number(salesData[0].totalRevenue) || 0,
      totalPurchases: Number(purchaseData[0].totalPurchases) || 0,
      totalProfit: Number(salesData[0].totalProfit) || 0,
      vatCollected: Number(salesData[0].totalVat) || 0,
      vehiclesSold: Number(salesData[0].vehiclesSold) || 0,
      vehiclesPurchased: Number(purchaseData[0].vehiclesPurchased) || 0,
    };
  }
}

export const storage = new DatabaseStorage();