import { vehicles, contacts, users, adminSessions, reservations, type Vehicle, type InsertVehicle, type Contact, type InsertContact, type User, type InsertUser, type AdminSession, type InsertAdminSession, type Reservation, type InsertReservation } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private contacts: Map<number, Contact>;
  private users: Map<number, User>;
  private adminSessions: Map<string, AdminSession>;
  private reservations: Map<number, Reservation>;
  private currentVehicleId: number;
  private currentContactId: number;
  private currentUserId: number;
  private currentSessionId: number;
  private currentReservationId: number;

  constructor() {
    this.vehicles = new Map();
    this.contacts = new Map();
    this.users = new Map();
    this.adminSessions = new Map();
    this.reservations = new Map();
    this.currentVehicleId = 1;
    this.currentContactId = 1;
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentReservationId = 1;
    
    // Initialize with sample premium vehicles and admin user
    this.initializeSampleVehicles();
    this.initializeAdminUser();
  }

  private initializeSampleVehicles() {
    const sampleVehicles: InsertVehicle[] = [
      {
        brand: "BMW",
        model: "5 Serie 530i Executive",
        year: 2019,
        price: 45500,
        mileage: 85000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Zwart",
        description: "Luxe executive sedan met uitgebreide optielijst",
        imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: true,
        available: true,
        status: "beschikbaar",
        availableDate: new Date("2024-01-15"),
        power: "252 PK / 185 kW",
        chassisNumber: "WBAJA91090B123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "Volledige APK-keuring uitgevoerd op 15-03-2024. Alle punten voldoen aan de eisen.",
        maintenanceHistory: "Volledige onderhoudshistorie aanwezig. Laatste grote beurt op 12-02-2024 bij BMW dealer.",
        options: [
          "Navigatiesysteem Professional",
          "Leder Dakota Zwart",
          "Stoelverwarming voor",
          "Parkeersensoren voor en achter",
          "Xenon verlichting",
          "Cruise control",
          "Dual-zone airconditioning"
        ],
        story: "Deze BMW 5 Serie 530i Executive is een prachtige sedan die perfect de balans vindt tussen comfort en dynamiek. De vorige eigenaar heeft de auto liefdevol onderhouden en alle services op tijd laten uitvoeren bij de officiële BMW dealer. Met zijn stijlvolle zwarte lak en luxe interieur is dit de perfecte auto voor de zakelijke rijder die geen compromissen wil maken.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/bmw-530i"
      },
      {
        brand: "Mercedes-Benz",
        model: "C 300 Coupé AMG",
        year: 2020,
        price: 52900,
        mileage: 42000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Wit",
        description: "Sportieve coupé met AMG styling pakket",
        imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: true,
        available: true,
        status: "gereserveerd",
        availableDate: new Date("2024-02-01"),
        power: "258 PK / 190 kW",
        chassisNumber: "WDD2053421A123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "APK-keuring uitgevoerd op 08-04-2024. Alle onderdelen goedgekeurd.",
        maintenanceHistory: "Regelmatig onderhoud bij Mercedes-Benz dealer. Laatste service op 20-03-2024.",
        options: [
          "AMG Line exterieur",
          "AMG Line interieur",
          "Multibeam LED koplampen",
          "Panoramadak",
          "Burmester surround sound",
          "Ambient verlichting",
          "Keyless-GO"
        ],
        story: "Deze Mercedes-Benz C 300 Coupé AMG is een waar kunstwerk op wielen. Het sportieve design gecombineerd met Duitse engineering maakt dit een bijzondere auto. De vorige eigenaar was een echte autoliefhebber die de auto perfect heeft onderhouden. Met zijn witte parel metallic lak en zwarte AMG details is dit een echte blikvanger.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/mercedes-c300"
      },
      {
        brand: "Audi",
        model: "A6 55 TFSI quattro",
        year: 2021,
        price: 48750,
        mileage: 35000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Grijs",
        description: "Premium sedan met quattro aandrijving",
        imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: true,
        available: true,
        status: "beschikbaar",
        availableDate: new Date("2024-03-10"),
        power: "340 PK / 250 kW",
        chassisNumber: "WAUZZZ4G5LN123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "APK-keuring uitgevoerd op 22-03-2024. Alle onderdelen goedgekeurd.",
        maintenanceHistory: "Volledig onderhouden bij Audi dealer. Laatste service op 15-03-2024.",
        options: ["Quattro aandrijving", "Virtual Cockpit", "Matrix LED verlichting", "Luchtvering", "B&O sound system"],
        story: "Deze Audi A6 55 TFSI quattro combineert elegantie met sportiviteit. De krachtige motor en quattro aandrijving zorgen voor uitstekende prestaties in alle omstandigheden.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/audi-a6"
      },
      {
        brand: "Porsche",
        model: "911 Carrera S",
        year: 2020,
        price: 125000,
        mileage: 18000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Rood",
        description: "Iconische sportwagen met ongeëvenaarde prestaties",
        imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: false,
        available: false,
        status: "verkocht",
        availableDate: new Date("2024-01-20"),
        power: "450 PK / 331 kW",
        chassisNumber: "WP0ZZZ99ZLS123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "Volledige Porsche inspectie uitgevoerd op 10-04-2024. Alle systemen optimaal.",
        maintenanceHistory: "Onderhouden bij Porsche Centrum. Laatste service op 05-04-2024.",
        options: ["Sport Chrono pakket", "PASM adaptieve dempers", "Porsche Communication Management", "Bose surround sound"],
        story: "Deze 911 Carrera S is het symbool van Porsche's erfgoed. Met zijn tijdloze design en adembenemende prestaties biedt deze auto een onvergetelijke rijervaring.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/porsche-911"
      },
      {
        brand: "Tesla",
        model: "Model S Performance",
        year: 2022,
        price: 89900,
        mileage: 25000,
        fuel: "Elektrisch",
        transmission: "Automaat",
        color: "Blauw",
        description: "Elektrische luxe sedan met autopilot",
        imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: false,
        available: true,
        status: "beschikbaar",
        availableDate: new Date("2024-02-28"),
        power: "1020 PK / 750 kW",
        chassisNumber: "5YJ3E1EA4NF123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "Tesla diagnostiek uitgevoerd op 28-03-2024. Alle systemen functioneren optimaal.",
        maintenanceHistory: "Onderhouden bij Tesla Service Center. Laatste update op 20-03-2024.",
        options: ["Autopilot Full Self-Driving", "Premium interieur", "Glass roof", "Premium audio", "Supercharging"],
        story: "Deze Tesla Model S Performance vertegenwoordigt de toekomst van luxe elektrisch rijden. Met zijn revolutionaire technologie en indrukwekkende prestaties.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/tesla-models"
      },
      {
        brand: "BMW",
        model: "X5 xDrive40i",
        year: 2021,
        price: 67500,
        mileage: 38000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Zwart",
        description: "Luxe SUV met xDrive vierwielaandrijving",
        imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1606016159991-b4c9f4b33a3c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: false,
        available: true,
        status: "gearchiveerd",
        availableDate: new Date("2024-01-05"),
        power: "340 PK / 250 kW",
        chassisNumber: "WBAJA31090B123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "APK-keuring uitgevoerd op 18-03-2024. Alle onderdelen goedgekeurd.",
        maintenanceHistory: "Regelmatig onderhouden bij BMW dealer. Laatste service op 10-03-2024.",
        options: ["xDrive vierwielaandrijving", "Panorama schuifdak", "Head-up display", "Harman Kardon sound", "Adaptive LED"],
        story: "Deze BMW X5 xDrive40i is de perfecte combinatie van luxe en veelzijdigheid. Ideaal voor zowel dagelijks gebruik als avontuurlijke uitstapjes.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/bmw-x5"
      }
    ];

    sampleVehicles.forEach(vehicle => {
      this.createVehicle(vehicle);
    });
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
    return Array.from(this.vehicles.values()).filter(v => v.available);
  }

  async getVehiclesByStatus(status?: string): Promise<Vehicle[]> {
    if (!status) {
      return Array.from(this.vehicles.values());
    }
    return Array.from(this.vehicles.values()).filter(v => v.status === status);
  }

  async getFeaturedVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(v => v.featured && v.available);
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
      metaDescription 
    };
    
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) {
      return undefined;
    }
    const updatedVehicle: Vehicle = { ...existingVehicle, ...vehicleUpdate };
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
}

export const storage = new MemStorage();
