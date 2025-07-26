import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import { insertContactSchema, insertVehicleSchema, insertReservationSchema, insertPurchaseSchema, insertSaleSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateInvoicePDF, createInvoiceData } from "./pdfService_new";
import { sendInvoiceEmail, sendContactFormEmail, sendContactAutoReply } from "./emailService";
import * as cheerio from 'cheerio';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Admin authentication middleware
async function authenticateAdmin(req: any, res: any, next: any) {
  // Check for token in authorization header first
  let token = req.headers.authorization?.replace('Bearer ', '');
  
  // If no token in header, check query params (for PDF downloads)
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const session = await storage.getAdminSession(token);
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await storage.getUser(session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Authentication error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers - development friendly
  app.use((req, res, next) => {
    const host = req.header('host') || '';
    const isDevelopment = host.includes('localhost') || 
                          host.includes('127.0.0.1') ||
                          host.includes('replit.dev') ||
                          host.includes('replit.co') ||
                          process.env.NODE_ENV === 'development';
    
    // Only apply strict security headers in production
    if (!isDevelopment) {
      // Security headers for production only
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://replit.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' https: wss:; " +
        "media-src 'self' https:; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests;"
      );
    } else {
      // Development-friendly headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', 
        "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://replit.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' http: https: ws: wss:; " +
        "media-src 'self' https:;"
      );
    }
    
    next();
  });

  // Serve service worker
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(process.cwd(), 'client/public/sw.js'));
  });

  // Serve uploaded images
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  app.use('/uploads', express.static(uploadsDir));

  // Image upload route
  app.post('/api/upload/image', authenticateAdmin, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const status = req.query.status as string;
      const vehicles = status ? await storage.getVehiclesByStatus(status) : await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/featured", async (req, res) => {
    try {
      const vehicles = await storage.getFeaturedVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }
      
      const vehicle = await storage.getVehicleById(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  // SEO-friendly vehicle route by slug
  app.get("/api/vehicles/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const vehicle = await storage.getVehicleBySlug(slug);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  // Dynamic sitemap.xml generation for SEO
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      const baseUrl = req.protocol + "://" + req.get("host");
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/aanbod</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/over-ons</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

      vehicles.forEach(vehicle => {
        sitemap += `
  <url>
    <loc>${baseUrl}/auto/${vehicle.slug}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      sitemap += `
</urlset>`;

      res.set("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate sitemap" });
    }
  });

  // robots.txt for SEO
  app.get("/robots.txt", (req, res) => {
    const baseUrl = req.protocol + "://" + req.get("host");
    const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`;
    
    res.set("Content-Type", "text/plain");
    res.send(robots);
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Contact routes
  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      
      // Send email notification to DD Cars
      try {
        await sendContactFormEmail({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone || '',
          message: validatedData.message
        });
        console.log('✅ Contact form email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send contact form email:', emailError);
        // Continue with response even if email fails
      }
      
      // Send auto-reply to customer
      try {
        await sendContactAutoReply(
          validatedData.email,
          `${validatedData.firstName} ${validatedData.lastName}`
        );
        console.log('✅ Auto-reply email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send auto-reply email:', emailError);
        // Continue with response even if email fails
      }
      
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password || user.role !== 'admin') {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.createAdminSession({
        sessionToken,
        userId: user.id,
        expiresAt
      });

      res.json({ 
        token: sessionToken, 
        user: { id: user.id, username: user.username, role: user.role },
        expiresAt 
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/logout", authenticateAdmin, async (req: any, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await storage.deleteAdminSession(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Protected admin routes
  app.get("/api/admin/vehicles", authenticateAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      const vehicles = await storage.getVehiclesByStatus(status);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.post("/api/admin/vehicles", authenticateAdmin, async (req, res) => {
    try {
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      const validatedData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validatedData);
      
      // No automatic purchase creation - will be done through separate purchase button
      
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      console.log("Server error:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put("/api/admin/vehicles/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }

      console.log("Update request body:", JSON.stringify(req.body, null, 2));
      const validatedData = insertVehicleSchema.partial().parse(req.body);
      
      // Get current vehicle to check status change
      const currentVehicle = await storage.getVehicleById(id);
      if (!currentVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      const vehicle = await storage.updateVehicle(id, validatedData);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Return special response when status changes to "verkocht" to trigger sale form
      if (validatedData.status === "verkocht" && currentVehicle.status !== "verkocht") {
        return res.json({ 
          ...vehicle, 
          requireSaleForm: true,
          message: "Status updated to sold - please complete sale details"
        });
      }

      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Update validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      console.log("Update server error:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.put("/api/admin/vehicles/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }

      const { status } = req.body;
      const validStatuses = ['beschikbaar', 'gereserveerd', 'verkocht', 'gearchiveerd'];
      
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status", 
          validStatuses 
        });
      }

      const updateData: any = { status };
      
      // If status is set to "beschikbaar", update the availableDate
      if (status === 'beschikbaar') {
        updateData.availableDate = new Date();
        updateData.available = true;
      } else {
        updateData.available = false;
      }

      const vehicle = await storage.updateVehicle(id, updateData);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to update vehicle status" });
    }
  });

  app.delete("/api/admin/vehicles/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }

      const deleted = await storage.deleteVehicle(id);
      if (!deleted) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      res.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  app.get("/api/admin/contacts", authenticateAdmin, async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Reservation routes
  app.post("/api/reservations", async (req, res) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      const reservation = await storage.createReservation(validatedData);
      res.json(reservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reservation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reservation" });
    }
  });

  app.get("/api/reservations", authenticateAdmin, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  app.get("/api/vehicles/:id/reservations", authenticateAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }
      
      const reservations = await storage.getReservationsByVehicle(vehicleId);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle reservations" });
    }
  });

  // Stripe payment intent route for reservations
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, vehicleId } = req.body;
      
      if (!amount || !vehicleId) {
        return res.status(400).json({ message: "Amount and vehicle ID are required" });
      }

      // For now, return a mock payment intent
      // In production, you would integrate with Stripe here
      const mockPaymentIntent = {
        client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        id: `pi_mock_${Date.now()}`,
        amount: Math.round(amount * 100), // Convert to cents
        currency: "eur",
        status: "requires_payment_method"
      };

      res.json({ 
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Purchase routes (Inkoop registratie)
  app.post("/api/admin/purchases", authenticateAdmin, async (req, res) => {
    try {
      const validatedData = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(validatedData);
      res.json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  app.get("/api/admin/purchases", authenticateAdmin, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/admin/purchases/vehicle/:vehicleId", authenticateAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }
      
      const purchase = await storage.getPurchaseByVehicleId(vehicleId);
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase" });
    }
  });

  app.put("/api/admin/purchases/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase ID" });
      }

      const validatedData = insertPurchaseSchema.partial().parse(req.body);
      const purchase = await storage.updatePurchase(id, validatedData);
      
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      res.json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid purchase data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update purchase" });
    }
  });

  app.delete("/api/admin/purchases/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid purchase ID" });
      }

      const deleted = await storage.deletePurchase(id);
      if (!deleted) {
        return res.status(404).json({ message: "Purchase not found" });
      }

      res.json({ message: "Purchase deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete purchase" });
    }
  });

  // Sale routes (Verkoop registratie)
  app.post("/api/admin/sales", authenticateAdmin, async (req, res) => {
    try {
      console.log("Received sale data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertSaleSchema.parse(req.body);
      console.log("Validated sale data:", JSON.stringify(validatedData, null, 2));
      const sale = await storage.createSale(validatedData);
      res.json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      console.log("Sale creation error:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  app.get("/api/admin/sales", authenticateAdmin, async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/admin/sales/vehicle/:vehicleId", authenticateAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }
      
      const sale = await storage.getSaleByVehicleId(vehicleId);
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.put("/api/admin/sales/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sale ID" });
      }

      const validatedData = insertSaleSchema.partial().parse(req.body);
      const sale = await storage.updateSale(id, validatedData);
      
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }

      res.json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid sale data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  app.delete("/api/admin/sales/:id", authenticateAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid sale ID" });
      }

      const deleted = await storage.deleteSale(id);
      if (!deleted) {
        return res.status(404).json({ message: "Sale not found" });
      }

      res.json({ message: "Sale deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Financial overview routes
  app.get("/api/admin/financial-overview", authenticateAdmin, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      
      const overview = await storage.getFinancialOverview(year, month);
      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch financial overview" });
    }
  });

  // Export routes
  app.get("/api/admin/export/purchases", authenticateAdmin, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      
      // Create CSV content
      const csvHeaders = "ID,Vehicle ID,Purchase Price,Supplier,Invoice Number,Purchase Date,Transport Cost,Maintenance Cost,Cleaning Cost,Other Costs,Notes,Created At";
      const csvRows = purchases.map(p => 
        `${p.id},${p.vehicleId},"${p.purchasePrice}","${p.supplier}","${p.invoiceNumber}","${p.purchaseDate}","${p.transportCost}","${p.maintenanceCost}","${p.cleaningCost}","${p.otherCosts}","${p.notes || ''}","${p.createdAt}"`
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="purchases.csv"');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export purchases" });
    }
  });

  app.get("/api/admin/export/sales", authenticateAdmin, async (req, res) => {
    try {
      const sales = await storage.getSales();
      
      // Create CSV content
      const csvHeaders = "ID,Vehicle ID,Sale Price,Customer Name,Customer Email,Customer Phone,Discount,VAT Type,Sale Date,Invoice Number,Notes,Created At";
      const csvRows = sales.map(s => 
        `${s.id},${s.vehicleId},"${s.salePrice}","${s.customerName}","${s.customerEmail}","${s.customerPhone}","${s.discount}","${s.vatType}","${s.saleDate}","${s.invoiceNumber}","${s.notes || ''}","${s.createdAt}"`
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales.csv"');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export sales" });
    }
  });

  // Individual Invoice PDF endpoints
  app.get('/api/admin/invoices/purchase/:vehicleId/pdf', authenticateAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const vehicle = await storage.getVehicleById(vehicleId);
      const purchase = await storage.getPurchaseByVehicleId(vehicleId);
      
      if (!vehicle || !purchase) {
        return res.status(404).json({ error: 'Vehicle or purchase not found' });
      }
      
      const invoiceData = createInvoiceData(vehicle, purchase);
      const pdfBuffer = await generateInvoicePDF(invoiceData);
      
      const filename = `inkoop_${purchase.invoiceNumber}_${vehicle.brand}_${vehicle.model}.pdf`;
      const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating purchase invoice PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  app.get('/api/admin/invoices/sale/:vehicleId/pdf', authenticateAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const vehicle = await storage.getVehicleById(vehicleId);
      const sale = await storage.getSaleByVehicleId(vehicleId);
      
      if (!vehicle || !sale) {
        return res.status(404).json({ error: 'Vehicle or sale not found' });
      }
      
      const invoiceData = createInvoiceData(vehicle, undefined, sale);
      const pdfBuffer = await generateInvoicePDF(invoiceData);
      
      const filename = `verkoop_${sale.invoiceNumber}_${vehicle.brand}_${vehicle.model}.pdf`;
      const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating sale invoice PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  // Email Invoice endpoints
  app.post('/api/admin/invoices/purchase/:vehicleId/email', authenticateAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }
      
      const vehicle = await storage.getVehicleById(vehicleId);
      const purchase = await storage.getPurchaseByVehicleId(vehicleId);
      
      if (!vehicle || !purchase) {
        return res.status(404).json({ error: 'Vehicle or purchase not found' });
      }
      
      const success = await sendInvoiceEmail(email, vehicle, purchase);
      
      if (success) {
        res.json({ message: 'Invoice email sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send invoice email' });
      }
    } catch (error) {
      console.error('Error sending purchase invoice email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  app.post('/api/admin/invoices/sale/:vehicleId/email', authenticateAdmin, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }
      
      const vehicle = await storage.getVehicleById(vehicleId);
      const sale = await storage.getSaleByVehicleId(vehicleId);
      
      if (!vehicle || !sale) {
        return res.status(404).json({ error: 'Vehicle or sale not found' });
      }
      
      const success = await sendInvoiceEmail(email, vehicle, undefined, sale);
      
      if (success) {
        res.json({ message: 'Invoice email sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send invoice email' });
      }
    } catch (error) {
      console.error('Error sending sale invoice email:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // License Plate Lookup Endpoint (RDW API)
  app.post('/api/admin/lookup-license-plate', authenticateAdmin, async (req, res) => {
    try {
      const { licensePlate } = req.body;
      
      if (!licensePlate) {
        return res.status(400).json({ error: 'License plate is required' });
      }

      // Clean license plate (remove spaces, dashes, make uppercase)
      const cleanPlate = licensePlate.replace(/[-\s]/g, '').toUpperCase();
      
      // RDW Open Data API call
      const rdwUrl = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${cleanPlate}`;
      const response = await fetch(rdwUrl);
      
      if (!response.ok) {
        return res.status(400).json({ error: 'Unable to fetch vehicle data from RDW' });
      }

      const rdwData = await response.json();
      
      if (!rdwData || rdwData.length === 0) {
        return res.status(404).json({ error: 'No vehicle found with this license plate' });
      }

      const vehicleData = rdwData[0];
      
      // Map RDW data to our vehicle structure
      const carData = {
        brand: vehicleData.merk || '',
        model: vehicleData.handelsbenaming || vehicleData.type || '',
        year: vehicleData.datum_eerste_toelating ? parseInt(vehicleData.datum_eerste_toelating.substring(0, 4)) : new Date().getFullYear(),
        price: '', // Price not available from RDW, user must enter
        mileage: 0, // Mileage not available from RDW, user must enter
        fuel: mapFuelType(vehicleData.brandstof_omschrijving),
        transmission: vehicleData.inrichting === 'automatisch' ? 'automaat' : 'handgeschakeld',
        color: vehicleData.eerste_kleur || '',
        description: generateDescription(vehicleData),
        images: [] as string[],
        // Additional data for BPM calculations
        co2Uitstoot: vehicleData.co2_uitstoot_gecombineerd ? parseInt(vehicleData.co2_uitstoot_gecombineerd) : undefined,
        datumEersteToelating: vehicleData.datum_eerste_toelating ? new Date(vehicleData.datum_eerste_toelating) : undefined,
        nettoCatalogusprijs: vehicleData.catalogusprijs ? parseInt(vehicleData.catalogusprijs) : undefined,
        power: vehicleData.vermogen_massarijklaar ? `${vehicleData.vermogen_massarijklaar} kW` : undefined,
        chassisNumber: vehicleData.voertuigsoort || undefined
      };

      res.json(carData);
    } catch (error) {
      console.error('License plate lookup error:', error);
      res.status(500).json({ error: 'Failed to lookup vehicle data' });
    }
  });

  // Helper function to map RDW fuel types to our system
  function mapFuelType(rdwFuelType: string): string {
    if (!rdwFuelType) return '';
    
    const fuel = rdwFuelType.toLowerCase();
    if (fuel.includes('benzine') || fuel.includes('gasoline')) return 'benzine';
    if (fuel.includes('diesel')) return 'diesel';
    if (fuel.includes('elektrisch') || fuel.includes('electric')) return 'elektrisch';
    if (fuel.includes('hybride') || fuel.includes('hybrid')) return 'hybrid';
    if (fuel.includes('lpg')) return 'lpg';
    if (fuel.includes('cng')) return 'cng';
    return rdwFuelType;
  }

  // Helper function to generate professional description from RDW data
  function generateDescription(vehicleData: any): string {
    const brand = vehicleData.merk || '';
    const model = vehicleData.handelsbenaming || vehicleData.type || '';
    const year = vehicleData.datum_eerste_toelating ? vehicleData.datum_eerste_toelating.substring(0, 4) : '';
    const fuel = vehicleData.brandstof_omschrijving || '';
    const power = vehicleData.vermogen_massarijklaar ? `${vehicleData.vermogen_massarijklaar} kW` : '';
    const doors = vehicleData.aantal_deuren || '';
    const seats = vehicleData.aantal_zitplaatsen || '';
    const transmission = vehicleData.inrichting ? vehicleData.inrichting : '';
    
    return `**${brand} ${model} ${year}**

**Voertuig specificaties:**
• Brandstof: ${fuel}
${power ? `• Vermogen: ${power}\n` : ''}${doors ? `• Aantal deuren: ${doors}\n` : ''}${seats ? `• Aantal zitplaatsen: ${seats}\n` : ''}${transmission ? `• Transmissie: ${transmission}\n` : ''}

**Conditie:**
• Volledig onderhouden en technisch in perfecte conditie
• Alle onderhoudsgeschiedenis beschikbaar
• Uitstekende staat binnen en buiten

**DD Cars Garantie:**
• Professionele inspectie uitgevoerd
• Transparante historie en documentatie
• Betrouwbare en kwalitatieve service

Een uitstekende keuze voor wie zoekt naar kwaliteit, prestaties en betrouwbaarheid.

*Alle informatie onder voorbehoud van typefouten. Wijzigingen en verkoop voorbehouden.*`;
  }

  // Marktplaats Import Endpoint (Fixed)
  app.post('/api/admin/import-marktplaats', authenticateAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || !url.includes('marktplaats.nl')) {
        return res.status(400).json({ error: 'Valid Marktplaats URL is required' });
      }

      // Fetch the page content with proper headers to avoid blocking
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });
      
      console.log('Marktplaats fetch status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.log('Marktplaats fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          url: url
        });
        return res.status(400).json({ 
          error: `Unable to fetch Marktplaats page (${response.status}: ${response.statusText})` 
        });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract car data from the page
      const carData = {
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        price: '',
        mileage: 0,
        fuel: '',
        transmission: '',
        color: '',
        description: '',
        images: [] as string[]
      };

      // Extract title and parse brand/model/year
      const title = $('h1').first().text().trim() || $('.mp-listing-title').text().trim() || $('title').text().trim();
      console.log('Extracted title:', title);
      
      if (title) {
        // Extract year from title
        const yearMatch = title.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          carData.year = parseInt(yearMatch[0]);
        }
        
        // Parse brand/model
        const titleParts = title.split(' ');
        if (titleParts.length >= 2) {
          carData.brand = titleParts[0];
          carData.model = titleParts.slice(1).join(' ').replace(/\b(19|20)\d{2}\b.*/, '').trim();
        }
      }

      // Extract specifications from various selectors
      const specs = {};
      
      // Enhanced specification extraction with better selectors
      $('.vip-specs tr, .vip-ad-attributes dt, .vip-ad-attributes dd, .mp-listing-attributes dt, .mp-listing-attributes dd, .attributes dt, .attributes dd, .spec-item, .specification-item').each((i, elem) => {
        const text = $(elem).text().trim().toLowerCase();
        const nextText = $(elem).next().text().trim();
        const fullText = $(elem).text().trim();
        
        // Enhanced mileage extraction with proper Dutch number formatting
        if (text.includes('kilometerstand') || text.includes('km-stand') || text.includes('kilometers') || text.includes('mileage')) {
          console.log('🚗 Found mileage field:', text, '→', nextText);
          
          // Enhanced patterns for Dutch number formatting (123.456 km or 123456 km)
          const patterns = [
            /(\d{1,3}(?:\.\d{3})*)\s*km/i,  // 123.456 km (Dutch thousands separator)
            /(\d{4,6})\s*km/i,              // 123456 km (no separator)
            /(\d{1,3}(?:\.\d{3})*)/i,       // Just the number part
            /(\d{4,6})/i                    // Just the number (4-6 digits)
          ];
          
          for (const pattern of patterns) {
            const kmMatch = nextText.match(pattern);
            if (kmMatch) {
              // Handle Dutch formatting: remove dots (thousands separator), keep number
              const mileageStr = kmMatch[1].replace(/\./g, '');
              const mileageNum = parseInt(mileageStr);
              console.log('🚗 Pattern matched:', pattern, 'raw:', kmMatch[1], 'cleaned:', mileageStr, 'parsed:', mileageNum);
              
              // Reasonable range for car mileage
              if (mileageNum >= 1000 && mileageNum <= 500000) {
                carData.mileage = mileageNum;
                console.log('✅ Set mileage to:', carData.mileage);
                break;
              }
            }
          }
        }
        
        // Extract mileage from same row text
        const mileageInRow = fullText.match(/([\d]{1,3}(?:[.,]\d{3})*)\s*km/i);
        if (mileageInRow && !carData.mileage) {
          const mileageStr = mileageInRow[1].replace(/[.,]/g, '');
          const mileageNum = parseInt(mileageStr);
          if (mileageNum > 0 && mileageNum < 2000000) {
            carData.mileage = mileageNum;
          }
        }
        
        if (text.includes('brandstof') || text.includes('fuel')) {
          const fuelText = nextText.toLowerCase();
          if (fuelText.includes('benzine') || fuelText.includes('gasoline')) carData.fuel = 'benzine';
          else if (fuelText.includes('diesel')) carData.fuel = 'diesel';
          else if (fuelText.includes('hybrid')) carData.fuel = 'hybrid';
          else if (fuelText.includes('elektrisch') || fuelText.includes('electric')) carData.fuel = 'elektrisch';
          else if (fuelText.includes('lpg')) carData.fuel = 'lpg';
        }
        
        if (text.includes('transmissie') || text.includes('schakeling') || text.includes('versnelling')) {
          const transText = nextText.toLowerCase();
          if (transText.includes('handgeschakeld') || transText.includes('hand') || transText.includes('manual')) carData.transmission = 'handgeschakeld';
          else if (transText.includes('automaat') || transText.includes('automatic') || transText.includes('aut')) carData.transmission = 'automaat';
          else if (transText.includes('semi')) carData.transmission = 'semi-automaat';
        }
        
        if (text.includes('kleur') || text.includes('color') || text.includes('lak')) {
          if (nextText && nextText.length > 0 && nextText !== '-') {
            carData.color = nextText;
          }
        }
      });

      // Alternative extraction from page content with enhanced patterns
      const fullText = $('body').text();
      
      // Enhanced fallback mileage extraction if not found
      if (!carData.mileage || carData.mileage <= 1000) {
        console.log('🔍 Fallback mileage extraction, current mileage:', carData.mileage);
        const mileagePatterns = [
          /kilometerstand[:\s]*(\d{1,3}(?:\.\d{3})+)\s*km/gi,          // "Kilometerstand: 123.456 km"
          /km-stand[:\s]*(\d{1,3}(?:\.\d{3})+)\s*km/gi,               // "Km-stand: 123.456 km"  
          /(\d{1,3}(?:\.\d{3})+)\s*km\b/gi,                           // "123.456 km" anywhere
          /(\d{4,6})\s*km\b/gi,                                       // "123456 km" without dots
          /kilometerstand[:\s]*(\d{4,6})\b/gi,                        // "Kilometerstand 123456"
          /(\d{1,3}(?:\.\d{3})+)\s*kilometer/gi                       // "123.456 kilometer"
        ];
        
        for (const pattern of mileagePatterns) {
          const matches = Array.from(fullText.matchAll(pattern));
          for (const match of matches) {
            console.log('🔍 Found pattern match:', match[0], 'captured:', match[1]);
            if (match[1]) {
              // Handle Dutch formatting: remove dots (thousands separator), keep number
              const mileageStr = match[1].replace(/\./g, '');
              const mileageNum = parseInt(mileageStr);
              console.log('🔍 Fallback extraction - raw:', match[1], 'cleaned:', mileageStr, 'parsed:', mileageNum);
              
              // Reasonable range for car mileage
              if (mileageNum >= 1000 && mileageNum <= 500000) {
                carData.mileage = mileageNum;
                console.log('✅ Fallback set mileage to:', carData.mileage);
                break;
              }
            }
          }
          if (carData.mileage && carData.mileage > 1000) {
            break; // Exit outer loop if we found a good mileage
          }
        }
      }
      
      // Extract fuel type if not found
      if (!carData.fuel) {
        if (fullText.toLowerCase().includes('benzine')) carData.fuel = 'benzine';
        else if (fullText.toLowerCase().includes('diesel')) carData.fuel = 'diesel';
        else if (fullText.toLowerCase().includes('hybrid')) carData.fuel = 'hybrid';
        else if (fullText.toLowerCase().includes('elektrisch')) carData.fuel = 'elektrisch';
      }
      
      // Extract transmission if not found
      if (!carData.transmission) {
        if (fullText.toLowerCase().includes('handgeschakeld')) carData.transmission = 'handgeschakeld';
        else if (fullText.toLowerCase().includes('automaat')) carData.transmission = 'automaat';
        else if (fullText.toLowerCase().includes('semi-automaat')) carData.transmission = 'semi-automaat';
      }

      // Extract price
      const priceText = $('.mp-text-price-label').text() || $('.price-label').text() || $('.mp-listing-price').text() || $('[class*="price"]').text();
      const priceMatch = priceText.match(/€\s*([\d.,]+)/);
      if (priceMatch) {
        carData.price = priceMatch[1].replace(/[.,]/g, '');
      }

      // Extract original description from Marktplaats
      const originalDescription = $('.mp-listing-description').text().trim() || $('.description').text().trim() || $('[class*="description"]').text().trim();
      carData.description = originalDescription || `${carData.brand} ${carData.model} ${carData.year} - Geïmporteerd van Marktplaats advertentie`;

      // Additional color extraction from page content if still not found
      if (!carData.color) {
        const colorKeywords = ['zwart', 'wit', 'grijs', 'blauw', 'rood', 'groen', 'zilver', 'goud', 'geel', 'oranje', 'beige', 'bruin', 'paars'];
        const pageText = fullText.toLowerCase();
        colorKeywords.forEach(color => {
          if (pageText.includes(color) && !carData.color) {
            carData.color = color.charAt(0).toUpperCase() + color.slice(1);
          }
        });
      }

      // Extract images
      const images: string[] = [];
      $('.mp-listing-images img, .listing-images img, .photo-carousel img').each((i, elem) => {
        const src = $(elem).attr('src') || $(elem).attr('data-src');
        if (src && src.includes('marktplaats') && !src.includes('placeholder')) {
          // Get the full-size image URL
          const fullImageUrl = src.replace(/\/s-\d+x\d+\//, '/s-1600x1200/');
          if (!images.includes(fullImageUrl)) {
            images.push(fullImageUrl);
          }
        }
      });
      carData.images = images.slice(0, 10); // Limit to 10 images

      // Clean up extracted data and brand detection
      if (!carData.brand && title) {
        // Enhanced brand detection with more brands
        const brands = [
          'Volkswagen', 'Mercedes-Benz', 'BMW', 'Audi', 'Toyota', 'Ford', 'Opel', 'Peugeot', 
          'Renault', 'Citroën', 'Nissan', 'Volvo', 'Skoda', 'SEAT', 'Kia', 'Hyundai', 
          'Mazda', 'Honda', 'Fiat', 'Porsche', 'Tesla', 'Jaguar', 'Land Rover', 'Mini',
          'Alfa Romeo', 'Lexus', 'Infiniti', 'Subaru', 'Mitsubishi', 'Suzuki', 'Dacia',
          'Smart', 'Jeep', 'Chrysler', 'Cadillac', 'Chevrolet', 'Lancia', 'Saab'
        ];
        
        for (const brand of brands) {
          if (title.toLowerCase().includes(brand.toLowerCase())) {
            carData.brand = brand;
            carData.model = title.replace(new RegExp(brand, 'gi'), '').replace(/\b(19|20)\d{2}\b.*/, '').trim();
            break;
          }
        }
      }

      // Generate structured description like RDW data
      carData.description = generateMarktplaatsDescription(carData, title);
      
      // Log enhanced extraction data for debugging
      console.log('Enhanced Marktplaats extraction result:', {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        fuel: carData.fuel,
        transmission: carData.transmission,
        color: carData.color,
        imageCount: carData.images.length
      });
      console.log('Final mileage extracted:', carData.mileage);
      console.log('Final color extracted:', carData.color);

      res.json(carData);
    } catch (error) {
      console.error('Marktplaats import error:', error);
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          res.status(500).json({ 
            error: 'Network error: Unable to access Marktplaats. The URL might be blocked or invalid.' 
          });
        } else {
          res.status(500).json({ 
            error: `Import failed: ${error.message}` 
          });
        }
      } else {
        res.status(500).json({ error: 'Failed to import car data from Marktplaats' });
      }
    }
  });

  // Helper function to generate structured description for Marktplaats imports
  function generateMarktplaatsDescription(carData: any, title: string): string {
    return `**${carData.brand} ${carData.model} ${carData.year}**

**Voertuig specificaties:**
• Brandstof: ${carData.fuel || 'Niet gespecificeerd'}
${carData.mileage ? `• Kilometerstand: ${carData.mileage.toLocaleString('nl-NL')} km\n` : ''}${carData.transmission ? `• Transmissie: ${carData.transmission}\n` : ''}${carData.color ? `• Kleur: ${carData.color}\n` : ''}
**Conditie:**
• Geïmporteerd van Marktplaats advertentie
• Controleer alle details bij bezichtiging
• Vraag naar onderhoudshistorie

**DD Cars Service:**
• Professionele inspectie aanbevolen
• Transparante bemiddeling
• Betrouwbare service en begeleiding

Een interessante auto geïmporteerd van Marktplaats. Alle details onder voorbehoud - controleer bij bezichtiging.

*Alle informatie onder voorbehoud van typefouten. Wijzigingen en verkoop voorbehouden.*`;
  }

  // AI Description Restructure Endpoint
  app.post('/api/admin/restructure-description', authenticateAdmin, async (req, res) => {
    try {
      const { description, vehicleData } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const prompt = `Restructureer deze autoverkoop beschrijving naar een professionele Nederlandse format voor DD Cars. Gebruik deze voertuiggegevens: ${vehicleData ? JSON.stringify(vehicleData) : 'geen extra gegevens'}.

Originele beschrijving:
${description}

Maak een professionele beschrijving in deze structuur:
**[Merk] [Model] [Jaar]**

**Voertuig specificaties:**
• [Brandstof, transmissie, kilometerstand, kleur etc.]

**Uitrusting & Opties:**
• [Alle genoemde opties en uitrusting]

**Conditie:**
• [Onderhoudsstatus, APK, etc.]

**DD Cars Garantie:**
• Professionele inspectie uitgevoerd
• Transparante historie en documentatie  
• Betrouwbare en kwalitatieve service

[Korte aantrekkelijke slotzin]

*Alle informatie onder voorbehoud van typefouten. Wijzigingen en verkoop voorbehouden.*

Antwoord alleen met de nieuwe beschrijving, geen extra tekst.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const restructuredDescription = response.text || "Kon beschrijving niet herstructureren";
      
      res.json({ description: restructuredDescription });
    } catch (error) {
      console.error('AI restructure error:', error);
      res.status(500).json({ error: 'Failed to restructure description' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
