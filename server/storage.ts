import { vehicles, contacts, users, type Vehicle, type InsertVehicle, type Contact, type InsertContact, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getFeaturedVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private contacts: Map<number, Contact>;
  private users: Map<number, User>;
  private currentVehicleId: number;
  private currentContactId: number;
  private currentUserId: number;

  constructor() {
    this.vehicles = new Map();
    this.contacts = new Map();
    this.users = new Map();
    this.currentVehicleId = 1;
    this.currentContactId = 1;
    this.currentUserId = 1;
    
    // Initialize with sample premium vehicles
    this.initializeSampleVehicles();
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
        featured: true,
        available: true,
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
        featured: true,
        available: true,
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
        featured: true,
        available: true,
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
        featured: false,
        available: true,
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
        featured: false,
        available: true,
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
        featured: false,
        available: true,
      }
    ];

    sampleVehicles.forEach(vehicle => {
      this.createVehicle(vehicle);
    });
  }

  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(v => v.available);
  }

  async getFeaturedVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(v => v.featured && v.available);
  }

  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentVehicleId++;
    const vehicle: Vehicle = { ...insertVehicle, id };
    this.vehicles.set(id, vehicle);
    return vehicle;
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
}

export const storage = new MemStorage();
