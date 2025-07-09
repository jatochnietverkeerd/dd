import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  price: integer("price").notNull(),
  mileage: integer("mileage").notNull(),
  fuel: text("fuel").notNull(),
  transmission: text("transmission").notNull(),
  color: text("color").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  images: text("images").array(),
  featured: boolean("featured").default(false),
  available: boolean("available").default(true),
  status: text("status").default("beschikbaar").notNull(), // beschikbaar, gereserveerd, verkocht, gearchiveerd
  availableDate: timestamp("available_date").defaultNow(),
  power: text("power"),
  chassisNumber: text("chassis_number"),
  napCheck: text("nap_check"),
  inspectionReport: text("inspection_report"),
  maintenanceHistory: text("maintenance_history"),
  options: text("options").array(),
  story: text("story"),
  videoUrl: text("video_url"),
  view360Url: text("view_360_url"),
  slug: text("slug").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  depositAmount: integer("deposit_amount").notNull(), // Amount in cents
  status: text("status").default("pending").notNull(), // pending, confirmed, cancelled
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inkoop registratie
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  supplier: text("supplier").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  transportCost: decimal("transport_cost", { precision: 10, scale: 2 }).default("0.00"),
  maintenanceCost: decimal("maintenance_cost", { precision: 10, scale: 2 }).default("0.00"),
  cleaningCost: decimal("cleaning_cost", { precision: 10, scale: 2 }).default("0.00"),
  otherCosts: decimal("other_costs", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verkoop registratie
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  purchaseId: integer("purchase_id").references(() => purchases.id),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("21.00"), // BTW percentage
  saleDate: timestamp("sale_date").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertAdminSessionSchema = createInsertSchema(adminSessions).omit({
  id: true,
  createdAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = z.infer<typeof insertAdminSessionSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
