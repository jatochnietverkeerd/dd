import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
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
          phone: validatedData.phone,
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
      const csvHeaders = "ID,Vehicle ID,Sale Price,Customer Name,Customer Email,Customer Phone,Discount,VAT Rate,Sale Date,Invoice Number,Notes,Created At";
      const csvRows = sales.map(s => 
        `${s.id},${s.vehicleId},"${s.salePrice}","${s.customerName}","${s.customerEmail}","${s.customerPhone}","${s.discount}","${s.vatRate}","${s.saleDate}","${s.invoiceNumber}","${s.notes || ''}","${s.createdAt}"`
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

  // Marktplaats Import Endpoint
  app.post('/api/admin/import-marktplaats', authenticateAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || !url.includes('marktplaats.nl')) {
        return res.status(400).json({ error: 'Valid Marktplaats URL is required' });
      }

      // Fetch the page content
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(400).json({ error: 'Unable to fetch Marktplaats page' });
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

      // Extract title and parse brand/model
      const title = $('h1').first().text().trim() || $('.mp-listing-title').text().trim();
      if (title) {
        const titleParts = title.split(' ');
        if (titleParts.length >= 2) {
          carData.brand = titleParts[0];
          carData.model = titleParts.slice(1).join(' ').replace(/\d{4}.*/, '').trim();
        }
      }

      // Extract price
      const priceText = $('.mp-text-price-label').text() || $('.price-label').text() || $('.mp-listing-price').text();
      const priceMatch = priceText.match(/€\s*([\d.,]+)/);
      if (priceMatch) {
        carData.price = priceMatch[1].replace(/[.,]/g, '');
      }

      // Extract description
      const description = $('.mp-listing-description').text().trim() || $('.description').text().trim();
      if (description) {
        carData.description = description;
      }

      // Extract specifications from the page
      $('.mp-listing-features li, .listing-features li, .spec-table-item').each((i, elem) => {
        const text = $(elem).text().toLowerCase();
        const fullText = $(elem).text();
        
        // Extract year
        const yearMatch = fullText.match(/(\d{4})/);
        if (yearMatch && parseInt(yearMatch[1]) >= 1980 && parseInt(yearMatch[1]) <= new Date().getFullYear()) {
          carData.year = parseInt(yearMatch[1]);
        }
        
        // Extract mileage
        const mileageMatch = fullText.match(/([\d.,]+)\s*km/i);
        if (mileageMatch) {
          carData.mileage = parseInt(mileageMatch[1].replace(/[.,]/g, ''));
        }
        
        // Extract fuel type
        if (text.includes('benzine') || text.includes('gasoline')) {
          carData.fuel = 'Benzine';
        } else if (text.includes('diesel')) {
          carData.fuel = 'Diesel';
        } else if (text.includes('elektrisch') || text.includes('electric')) {
          carData.fuel = 'Elektrisch';
        } else if (text.includes('hybride') || text.includes('hybrid')) {
          carData.fuel = 'Hybride';
        }
        
        // Extract transmission
        if (text.includes('handgeschakeld') || text.includes('manual')) {
          carData.transmission = 'Handgeschakeld';
        } else if (text.includes('automaat') || text.includes('automatic')) {
          carData.transmission = 'Automaat';
        }
        
        // Extract color
        const colorKeywords = ['zwart', 'wit', 'grijs', 'blauw', 'rood', 'groen', 'zilver', 'goud', 'geel', 'oranje'];
        colorKeywords.forEach(color => {
          if (text.includes(color)) {
            carData.color = color.charAt(0).toUpperCase() + color.slice(1);
          }
        });
      });

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

      // Clean up extracted data
      if (!carData.brand && title) {
        // Try to extract brand from common car brands
        const brands = ['Volkswagen', 'Mercedes-Benz', 'BMW', 'Audi', 'Toyota', 'Ford', 'Opel', 'Peugeot', 'Renault', 'Citroën', 'Nissan', 'Volvo', 'Skoda', 'SEAT', 'Kia', 'Hyundai', 'Mazda', 'Honda', 'Fiat'];
        for (const brand of brands) {
          if (title.toLowerCase().includes(brand.toLowerCase())) {
            carData.brand = brand;
            carData.model = title.replace(new RegExp(brand, 'gi'), '').replace(/\d{4}.*/, '').trim();
            break;
          }
        }
      }

      res.json(carData);
    } catch (error) {
      console.error('Marktplaats import error:', error);
      res.status(500).json({ error: 'Failed to import car data from Marktplaats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
