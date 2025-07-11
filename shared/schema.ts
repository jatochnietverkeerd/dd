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
  // BPM calculation fields
  co2Uitstoot: integer("co2_uitstoot"), // CO2 emissions in g/km
  datumEersteToelating: timestamp("datum_eerste_toelating"), // First registration date
  nettoCatalogusprijs: integer("netto_catalogusprijs"), // Net catalog price
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
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(), // Excl. BTW
  vatType: text("vat_type").notNull(), // "21%", "marge", "geen_btw"
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0.00"),
  bpmAmount: decimal("bpm_amount", { precision: 10, scale: 2 }).default("0.00"),
  supplier: text("supplier").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  transportCost: decimal("transport_cost", { precision: 10, scale: 2 }).default("0.00"),
  maintenanceCost: decimal("maintenance_cost", { precision: 10, scale: 2 }).default("0.00"),
  cleaningCost: decimal("cleaning_cost", { precision: 10, scale: 2 }).default("0.00"),
  guaranteeCost: decimal("guarantee_cost", { precision: 10, scale: 2 }).default("0.00"),
  otherCosts: decimal("other_costs", { precision: 10, scale: 2 }).default("0.00"),
  totalCostInclVat: decimal("total_cost_incl_vat", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Verkoop registratie
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  purchaseId: integer("purchase_id").references(() => purchases.id),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).default("0.00"), // Excl. BTW
  vatType: text("vat_type").notNull(), // "21%", "marge", "geen_btw" - inherited from purchase
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0.00"),
  salePriceInclVat: decimal("sale_price_incl_vat", { precision: 10, scale: 2 }).default("0.00"),
  customerName: text("customer_name").default(""),
  customerEmail: text("customer_email").default(""),
  customerPhone: text("customer_phone").default(""),
  customerAddress: text("customer_address").default(""),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).default("0.00"),
  paymentMethod: text("payment_method").default(""),
  saleDate: timestamp("sale_date").notNull(),
  deliveryDate: timestamp("delivery_date"),
  warrantyMonths: integer("warranty_months").default(12),
  invoiceNumber: text("invoice_number").default(""),
  profitExclVat: decimal("profit_excl_vat", { precision: 10, scale: 2 }).default("0.00"),
  profitInclVat: decimal("profit_incl_vat", { precision: 10, scale: 2 }).default("0.00"),
  purchaseCostPrice: decimal("purchase_cost_price", { precision: 10, scale: 2 }).default("0.00"),
  // BPM fields for sales (can be inherited from purchase or manually entered)
  bpmAmount: decimal("bmp_amount", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  slug: true,
  metaTitle: true,
  metaDescription: true,
}).extend({
  // Make BPM fields optional for vehicle creation
  co2Uitstoot: z.number().optional(),
  datumEersteToelating: z.string().optional().transform(val => val ? new Date(val) : undefined),
  nettoCatalogusprijs: z.number().optional(),
  // Make purchase fields optional
  purchasePrice: z.number().optional(),
  purchaseVatType: z.string().optional(),
  bpmAmount: z.number().optional(),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  purchaseDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  transportCost: z.number().optional(),
  maintenanceCost: z.number().optional(),
  cleaningCost: z.number().optional(),
  guaranteeCost: z.number().optional(),
  otherCosts: z.number().optional(),
  totalCostInclVat: z.number().optional(),
  notes: z.string().optional(),
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
}).extend({
  salePrice: z.number().transform(val => val.toString()),
  vatAmount: z.number().transform(val => val.toString()),
  salePriceInclVat: z.number().transform(val => val.toString()),
  discount: z.number().transform(val => val.toString()),
  finalPrice: z.number().transform(val => val.toString()),
  profitExclVat: z.number().transform(val => val.toString()),
  profitInclVat: z.number().transform(val => val.toString()),
  saleDate: z.string().transform(val => new Date(val)),
  deliveryDate: z.string().optional().transform(val => val && val !== "" ? new Date(val) : null),
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
