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
    
    // Initialize with sample premium vehicles and admin user
    this.initializeSampleVehicles();
    this.initializeAdminUser();
    this.initializeSamplePurchases();
    this.initializeSampleSales();
  }

  private initializeSampleVehicles() {
    const sampleVehicles: InsertVehicle[] = [
      {
        brand: "Volkswagen",
        model: "Golf GTI",
        year: 2023,
        price: 38900,
        mileage: 15000,
        fuel: "Benzine",
        transmission: "Handgeschakeld",
        color: "Tornado Red",
        description: "Iconische Volkswagen Golf GTI in perfecte staat. De perfecte combinatie van sportiviteit en dagelijks gebruiksgemak.",
        imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: true,
        available: true,
        status: "beschikbaar",
        availableDate: new Date("2024-01-15"),
        power: "245 PK / 180 kW",
        chassisNumber: "WVWZZZ1KZPW123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "Volledige APK-keuring uitgevoerd op 15-05-2024. Alle punten voldoen aan de eisen.",
        maintenanceHistory: "Volledige onderhoudshistorie aanwezig. Laatste service op 20-04-2024 bij Volkswagen dealer.",
        options: [
          "GTI Performance pakket",
          "Climatronic airconditioning",
          "Discover Pro navigatie",
          "LED koplampen",
          "Parkeersensoren achter",
          "Cruise control",
          "Sportonderstel"
        ],
        story: "Deze Volkswagen Golf GTI belichaamt de essentie van de hot hatch. Met zijn iconische rode kleur en sportieve prestaties is dit de perfecte auto voor de liefhebber die dagelijks plezier wil beleven achter het stuur. Recent onderhouden en in topconditie.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/vw-golf-gti"
      },
      {
        brand: "Volkswagen",
        model: "T-Roc R-Line",
        year: 2022,
        price: 32500,
        mileage: 25000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Deep Black Pearl",
        description: "Moderne Volkswagen T-Roc in sportieve R-Line uitvoering. Hoge zitpositie en uitstekende wegligging.",
        imageUrl: "https://images.unsplash.com/photo-1533473359331-0518db878d92?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1533473359331-0518db878d92?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: true,
        available: true,
        status: "beschikbaar",
        availableDate: new Date("2024-01-20"),
        power: "190 PK / 140 kW",
        chassisNumber: "WVWZZZ1NZNW123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "APK-keuring uitgevoerd op 10-05-2024. Alle onderdelen goedgekeurd.",
        maintenanceHistory: "Regelmatig onderhoud bij Volkswagen dealer. Laatste service op 15-04-2024.",
        options: [
          "R-Line exterieur pakket",
          "R-Line interieur",
          "Panorama schuifdak",
          "Virtueel cockpit",
          "Beats audio systeem",
          "Adaptive cruise control",
          "Keyless start"
        ],
        story: "Deze Volkswagen T-Roc R-Line combineert de voordelen van een SUV met sportieve styling. Perfect voor zowel het dagelijks woon-werkverkeer als weekenduitstapjes. De hoge zitpositie en moderne technologie maken elke rit een plezier.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/vw-t-roc"
      },
      {
        brand: "Volkswagen",
        model: "Polo GTI",
        year: 2024,
        price: 29900,
        mileage: 8000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Pure White",
        description: "Gloednieuwe Volkswagen Polo GTI - compacte sportiviteit op zijn best.",
        imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: true,
        available: true,
        status: "beschikbaar",
        availableDate: new Date("2024-02-01"),
        power: "207 PK / 152 kW",
        chassisNumber: "WVWZZZ6RZPW123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "Nieuw voertuig - fabrieksgarantie tot 2027.",
        maintenanceHistory: "Nieuw voertuig - eerste service gepland voor juli 2024.",
        options: [
          "GTI Performance pakket",
          "Beats audio systeem",
          "Climatronic 2-zones",
          "Adaptive cruise control",
          "Sportonderstel",
          "LED koplampen",
          "Draadloos laden"
        ],
        story: "Deze splinternieuwe Volkswagen Polo GTI is het bewijs dat grote prestaties in kleine pakketten kunnen. Met zijn moderne technologie en iconische GTI-genen biedt deze compacte sportwagen pure rijvreugde. Perfect voor de stad en toch sportief genoeg voor de buitenweg.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/vw-polo-gti"
      },
      {
        brand: "Mercedes-Benz",
        model: "A-Klasse A35 AMG",
        year: 2022,
        price: 42900,
        mileage: 22000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Mountain Grey",
        description: "Krachtige Mercedes-Benz A-Klasse A35 AMG. Compacte sportwagen met AMG prestaties.",
        imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1563720223185-11003d516935?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: true,
        available: true,
        status: "gereserveerd",
        availableDate: new Date("2024-02-15"),
        power: "306 PK / 225 kW",
        chassisNumber: "WDD1770442A123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "APK-keuring uitgevoerd op 20-04-2024. Alle onderdelen goedgekeurd.",
        maintenanceHistory: "Regelmatig onderhoud bij Mercedes-Benz dealer. Laatste service op 10-04-2024.",
        options: [
          "AMG Performance pakket",
          "AMG Track Pace",
          "Panorama schuifdak",
          "Burmester surround sound",
          "MBUX infotainment",
          "Adaptive dempers",
          "Performance remsysteem"
        ],
        story: "Deze Mercedes-Benz A35 AMG is een ware wolf in schaapskleren. Onder de elegante compacte verschijning schuilt een krachtige AMG-motor die voor adembenemende prestaties zorgt. Perfect voor de rijder die luxe en sportiviteit wil combineren in een praktische vorm.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/mercedes-a35"
      },
      {
        brand: "Volkswagen",
        model: "Golf R 2.0 TSI",
        year: 2021,
        price: 44500,
        mileage: 31000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Lapiz Blue",
        description: "Krachtige Volkswagen Golf R met vierwielaandrijving. De perfecte combinatie van sportiviteit en dagelijks gebruiksgemak.",
        imageUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: false,
        available: true,
        status: "beschikbaar",
        availableDate: new Date("2024-01-25"),
        power: "320 PK / 235 kW",
        chassisNumber: "WVWZZZ1KZMW123456",
        napCheck: "NAP-check uitgevoerd - Geen schade gemeld",
        inspectionReport: "APK-keuring uitgevoerd op 25-04-2024. Alle onderdelen goedgekeurd.",
        maintenanceHistory: "Volledig onderhouden bij Volkswagen dealer. Laatste service op 20-04-2024.",
        options: [
          "4Motion vierwielaandrijving",
          "DCC adaptieve dempers",
          "Akrapovic uitlaat",
          "Recaro sportstoelen",
          "Virtueel cockpit Pro",
          "Harman Kardon audio",
          "Race modus"
        ],
        story: "Deze Volkswagen Golf R is het summum van Duitse engineering in compacte vorm. Met zijn vierwielaandrijving en krachtige motor biedt deze auto prestaties die rivaliseren met veel duurdere sportwagens. De perfecte keuze voor de autoliefhebber die het beste van beide werelden wil.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/vw-golf-r"
      },
      {
        brand: "Volkswagen",
        model: "Polo GTI & Golf GTI Duo",
        year: 2024,
        price: 65000,
        mileage: 5000,
        fuel: "Benzine",
        transmission: "Automaat",
        color: "Tornado Red / Pure White",
        description: "Exclusieve aanbieding: Volkswagen Polo GTI en Golf GTI samen als duo. Perfect voor liefhebbers van de GTI-lijn.",
        imageUrl: "https://images.unsplash.com/photo-1544829099-b9a0c5303bea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        images: [
          "https://images.unsplash.com/photo-1544829099-b9a0c5303bea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        featured: true,
        available: true,
        status: "beschikbaar",
        availableDate: new Date("2024-03-01"),
        power: "245 PK / 180 kW & 207 PK / 152 kW",
        chassisNumber: "WVWZZZ1KZPW123456 & WVWZZZ6RZPW654321",
        napCheck: "NAP-check uitgevoerd voor beide voertuigen - Geen schade gemeld",
        inspectionReport: "Beide voertuigen nieuw - fabrieksgarantie tot 2027.",
        maintenanceHistory: "Beide voertuigen nieuw - eerste services gepland voor 2024.",
        options: [
          "GTI Performance pakket (beide)",
          "Climatronic airconditioning",
          "Discover Pro navigatie",
          "LED koplampen",
          "Sportonderstel",
          "Beats audio systeem",
          "Exclusieve GTI accessoires"
        ],
        story: "Deze exclusieve GTI-duo aanbieding is perfect voor de echte Volkswagen GTI liefhebber. Of het nu voor vader en zoon is, of voor de verzamelaar die beide iconen wil bezitten - deze combinatie biedt de volledige GTI-ervaring van compact tot premium hot hatch. Beide auto's zijn in nieuwstaat en bieden jaren rijplezier.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        view360Url: "https://example.com/360-view/vw-gti-duo"
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

  private initializeSamplePurchases() {
    const samplePurchases: Purchase[] = [
      {
        id: 1,
        vehicleId: 1,
        purchasePrice: 32000,
        supplier: "Volkswagen Dealer Groep",
        invoiceNumber: "INV-2024-001",
        purchaseDate: new Date("2024-01-10"),
        transportCost: 200,
        maintenanceCost: 400,
        cleaningCost: 150,
        otherCosts: 100,
        notes: "Inkoop Golf GTI 2023 - uitstekende staat",
        createdAt: new Date("2024-01-10")
      },
      {
        id: 2,
        vehicleId: 2,
        purchasePrice: 26000,
        supplier: "Volkswagen Import B.V.",
        invoiceNumber: "INV-2024-002",
        purchaseDate: new Date("2024-01-15"),
        transportCost: 250,
        maintenanceCost: 300,
        cleaningCost: 200,
        otherCosts: 150,
        notes: "T-Roc R-Line inkoop - perfecte staat",
        createdAt: new Date("2024-01-15")
      },
      {
        id: 3,
        vehicleId: 3,
        purchasePrice: 25000,
        supplier: "Volkswagen Centrum",
        invoiceNumber: "INV-2024-003",
        purchaseDate: new Date("2024-01-25"),
        transportCost: 150,
        maintenanceCost: 200,
        cleaningCost: 100,
        otherCosts: 50,
        notes: "Polo GTI 2024 - nieuwstaat",
        createdAt: new Date("2024-01-25")
      },
      {
        id: 4,
        vehicleId: 4,
        purchasePrice: 35000,
        supplier: "Mercedes-Benz Nederland",
        invoiceNumber: "INV-2024-004",
        purchaseDate: new Date("2024-02-01"),
        transportCost: 300,
        maintenanceCost: 800,
        cleaningCost: 250,
        otherCosts: 200,
        notes: "A35 AMG inkoop - AMG Performance",
        createdAt: new Date("2024-02-01")
      }
    ];

    samplePurchases.forEach(purchase => {
      this.purchases.set(purchase.id, purchase);
    });
    this.currentPurchaseId = 5;
  }

  private initializeSampleSales() {
    const sampleSales: Sale[] = [
      {
        id: 1,
        vehicleId: 1,
        salePrice: 38900,
        customerName: "Erik van der Berg",
        customerEmail: "erik@example.com",
        customerPhone: "06-12345678",
        discount: 0,
        vatRate: 21,
        saleDate: new Date("2024-03-01"),
        invoiceNumber: "FACT-2024-001",
        notes: "GTI liefhebber - snelle verkoop",
        createdAt: new Date("2024-03-01")
      },
      {
        id: 2,
        vehicleId: 2,
        salePrice: 31900,
        customerName: "Sandra Bakker",
        customerEmail: "sandra@example.com",
        customerPhone: "06-87654321",
        discount: 600,
        vatRate: 21,
        saleDate: new Date("2024-03-10"),
        invoiceNumber: "FACT-2024-002",
        notes: "Perfecte SUV voor jonge familie",
        createdAt: new Date("2024-03-10")
      },
      {
        id: 3,
        vehicleId: 3,
        salePrice: 29500,
        customerName: "Tim Visser",
        customerEmail: "tim@example.com",
        customerPhone: "06-11223344",
        discount: 400,
        vatRate: 21,
        saleDate: new Date("2024-03-15"),
        invoiceNumber: "FACT-2024-003",
        notes: "Eerste auto - compacte GTI perfect",
        createdAt: new Date("2024-03-15")
      }
    ];

    sampleSales.forEach(sale => {
      this.sales.set(sale.id, sale);
    });
    this.currentSaleId = 4;
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

  // Financial reports
  async getFinancialOverview(year?: number, month?: number): Promise<{
    totalRevenue: number;
    totalPurchases: number;
    totalProfit: number;
    vatCollected: number;
    vehiclesSold: number;
    vehiclesPurchased: number;
  }> {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month;

    const salesData = Array.from(this.sales.values()).filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const saleYear = saleDate.getFullYear();
      const saleMonth = saleDate.getMonth() + 1;
      
      if (currentMonth) {
        return saleYear === currentYear && saleMonth === currentMonth;
      }
      return saleYear === currentYear;
    });

    const purchaseData = Array.from(this.purchases.values()).filter(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate);
      const purchaseYear = purchaseDate.getFullYear();
      const purchaseMonth = purchaseDate.getMonth() + 1;
      
      if (currentMonth) {
        return purchaseYear === currentYear && purchaseMonth === currentMonth;
      }
      return purchaseYear === currentYear;
    });

    const totalRevenue = salesData.reduce((sum, sale) => {
      return sum + (parseFloat(sale.salePrice) - parseFloat(sale.discount));
    }, 0);

    const totalPurchases = purchaseData.reduce((sum, purchase) => {
      return sum + parseFloat(purchase.purchasePrice) + 
             parseFloat(purchase.transportCost) + 
             parseFloat(purchase.maintenanceCost) + 
             parseFloat(purchase.cleaningCost) + 
             parseFloat(purchase.otherCosts);
    }, 0);

    const vatCollected = salesData.reduce((sum, sale) => {
      const netAmount = parseFloat(sale.salePrice) - parseFloat(sale.discount);
      return sum + (netAmount * parseFloat(sale.vatRate) / 100);
    }, 0);

    const totalProfit = totalRevenue - totalPurchases;

    return {
      totalRevenue,
      totalPurchases,
      totalProfit,
      vatCollected,
      vehiclesSold: salesData.length,
      vehiclesPurchased: purchaseData.length,
    };
  }
}

export const storage = new MemStorage();
