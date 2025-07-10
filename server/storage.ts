import { vehicles, contacts, users, adminSessions, reservations, purchases, sales, type Vehicle, type InsertVehicle, type Contact, type InsertContact, type User, type InsertUser, type AdminSession, type InsertAdminSession, type Reservation, type InsertReservation, type Purchase, type InsertPurchase, type Sale, type InsertSale } from "@shared/schema";
import { generateSlug, generateMetaTitle, generateMetaDescription } from "@shared/utils";

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

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private contacts: Map<number, Contact>;
  private users: Map<number, User>;
  private adminSessions: Map<string, AdminSession>;
  private reservations: Map<number, Reservation>;
  private purchases: Map<number, Purchase>;
  private sales: Map<number, Sale>;
  private currentVehicleId: number;
  private currentContactId: number;
  private currentUserId: number;
  private currentSessionId: number;
  private currentReservationId: number;
  private currentPurchaseId: number;
  private currentSaleId: number;

  constructor() {
    this.vehicles = new Map();
    this.contacts = new Map();
    this.users = new Map();
    this.adminSessions = new Map();
    this.reservations = new Map();
    this.purchases = new Map();
    this.sales = new Map();
    this.currentVehicleId = 1;
    this.currentContactId = 1;
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentReservationId = 1;
    this.currentPurchaseId = 1;
    this.currentSaleId = 1;
    
    // Initialize with admin user only
    this.initializeAdminUser();
  }

  private initializeAdminUser() {
    // Create default admin user (username: admin, password: admin123)
    this.createUser({
      username: "admin",
      password: "admin123", // In real app, this should be hashed
      role: "admin"
    });
  }

  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehiclesByStatus(status?: string): Promise<Vehicle[]> {
    const vehicles = Array.from(this.vehicles.values());
    if (!status) return vehicles;
    return vehicles.filter(v => v.status === status);
  }

  async getFeaturedVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(v => v.featured);
  }

  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehicleBySlug(slug: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(v => v.slug === slug);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleId++;
    
    // Generate SEO-friendly slug and meta tags
    const slug = generateSlug(insertVehicle.brand, insertVehicle.model, insertVehicle.year);
    const metaTitle = generateMetaTitle(insertVehicle.brand, insertVehicle.model, insertVehicle.year, insertVehicle.price);
    const metaDescription = generateMetaDescription(
      insertVehicle.brand, 
      insertVehicle.model, 
      insertVehicle.year, 
      insertVehicle.mileage, 
      insertVehicle.fuel, 
      insertVehicle.transmission
    );
    
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id, 
      slug, 
      metaTitle, 
      metaDescription,
      availableDate: new Date(),
      // Ensure new vehicles are available by default
      available: insertVehicle.available !== undefined ? insertVehicle.available : true
    };
    
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) {
      return undefined;
    }
    
    // Regenerate SEO fields if relevant data changed
    let seoFields = {};
    if (vehicleUpdate.brand || vehicleUpdate.model || vehicleUpdate.year || vehicleUpdate.price || vehicleUpdate.mileage || vehicleUpdate.fuel || vehicleUpdate.transmission) {
      const brand = vehicleUpdate.brand || existingVehicle.brand;
      const model = vehicleUpdate.model || existingVehicle.model;
      const year = vehicleUpdate.year || existingVehicle.year;
      const price = vehicleUpdate.price || existingVehicle.price;
      const mileage = vehicleUpdate.mileage || existingVehicle.mileage;
      const fuel = vehicleUpdate.fuel || existingVehicle.fuel;
      const transmission = vehicleUpdate.transmission || existingVehicle.transmission;
      
      seoFields = {
        slug: generateSlug(brand, model, year),
        metaTitle: generateMetaTitle(brand, model, year, price),
        metaDescription: generateMetaDescription(brand, model, year, mileage, fuel, transmission)
      };
    }
    
    const updatedVehicle: Vehicle = { ...existingVehicle, ...vehicleUpdate, ...seoFields };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const contact: Contact = { ...insertContact, id, createdAt: new Date() };
    this.contacts.set(id, contact);
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Admin session operations
  async createAdminSession(sessionData: InsertAdminSession): Promise<AdminSession> {
    const id = this.currentSessionId++;
    const session: AdminSession = { 
      ...sessionData, 
      id,
      createdAt: new Date()
    };
    this.adminSessions.set(sessionData.sessionToken, session);
    return session;
  }

  async getAdminSession(token: string): Promise<AdminSession | undefined> {
    const session = this.adminSessions.get(token);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.adminSessions.delete(token);
    }
    return undefined;
  }

  async deleteAdminSession(token: string): Promise<boolean> {
    return this.adminSessions.delete(token);
  }

  async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    for (const [token, session] of this.adminSessions.entries()) {
      if (session.expiresAt <= now) {
        this.adminSessions.delete(token);
      }
    }
  }

  // Reservation operations
  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const id = this.currentReservationId++;
    const reservation: Reservation = { 
      ...insertReservation, 
      id,
      createdAt: new Date()
    };
    this.reservations.set(id, reservation);
    return reservation;
  }

  async getReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async getReservationsByVehicle(vehicleId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(r => r.vehicleId === vehicleId);
  }

  async updateReservation(id: number, updates: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const existingReservation = this.reservations.get(id);
    if (!existingReservation) {
      return undefined;
    }
    const updatedReservation: Reservation = { ...existingReservation, ...updates };
    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }

  // Purchase operations
  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = this.currentPurchaseId++;
    const purchase: Purchase = { 
      ...insertPurchase, 
      id,
      createdAt: new Date()
    };
    this.purchases.set(id, purchase);
    return purchase;
  }

  async getPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values());
  }

  async getPurchaseByVehicleId(vehicleId: number): Promise<Purchase | undefined> {
    return Array.from(this.purchases.values()).find(p => p.vehicleId === vehicleId);
  }

  async updatePurchase(id: number, updates: Partial<InsertPurchase>): Promise<Purchase | undefined> {
    const existingPurchase = this.purchases.get(id);
    if (!existingPurchase) {
      return undefined;
    }
    const updatedPurchase: Purchase = { ...existingPurchase, ...updates };
    this.purchases.set(id, updatedPurchase);
    return updatedPurchase;
  }

  async deletePurchase(id: number): Promise<boolean> {
    return this.purchases.delete(id);
  }

  // Sale operations
  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = this.currentSaleId++;
    const sale: Sale = { 
      ...insertSale, 
      id,
      createdAt: new Date()
    };
    this.sales.set(id, sale);
    return sale;
  }

  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSaleByVehicleId(vehicleId: number): Promise<Sale | undefined> {
    return Array.from(this.sales.values()).find(s => s.vehicleId === vehicleId);
  }

  async updateSale(id: number, updates: Partial<InsertSale>): Promise<Sale | undefined> {
    const existingSale = this.sales.get(id);
    if (!existingSale) {
      return undefined;
    }
    const updatedSale: Sale = { ...existingSale, ...updates };
    this.sales.set(id, updatedSale);
    return updatedSale;
  }

  async deleteSale(id: number): Promise<boolean> {
    return this.sales.delete(id);
  }

  async getFinancialOverview(year?: number, month?: number): Promise<{
    totalRevenue: number;
    totalPurchases: number;
    totalProfit: number;
    vatCollected: number;
    vehiclesSold: number;
    vehiclesPurchased: number;
  }> {
    const sales = Array.from(this.sales.values());
    const purchases = Array.from(this.purchases.values());
    
    // Filter by year/month if provided
    let filteredSales = sales;
    let filteredPurchases = purchases;
    
    if (year) {
      filteredSales = sales.filter(s => s.createdAt && s.createdAt.getFullYear() === year);
      filteredPurchases = purchases.filter(p => p.createdAt && p.createdAt.getFullYear() === year);
      
      if (month) {
        filteredSales = filteredSales.filter(s => s.createdAt && s.createdAt.getMonth() === month - 1);
        filteredPurchases = filteredPurchases.filter(p => p.createdAt && p.createdAt.getMonth() === month - 1);
      }
    }
    
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + Number(sale.salePrice), 0);
    const totalPurchases = filteredPurchases.reduce((sum, purchase) => {
      return sum + Number(purchase.purchasePrice) + Number(purchase.transportCost || 0) + 
             Number(purchase.maintenanceCost || 0) + Number(purchase.cleaningCost || 0) + 
             Number(purchase.otherCosts || 0);
    }, 0);
    
    const totalProfit = totalRevenue - totalPurchases;
    const vatCollected = totalRevenue * 0.21; // 21% VAT
    
    return {
      totalRevenue,
      totalPurchases,
      totalProfit,
      vatCollected,
      vehiclesSold: filteredSales.length,
      vehiclesPurchased: filteredPurchases.length
    };
  }
}

export const storage = new MemStorage();