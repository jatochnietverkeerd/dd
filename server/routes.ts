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
import { upload as cloudinaryUpload, uploadToCloudinary, deleteFromCloudinary, getCloudinaryImages } from "./cloudinaryService";

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

  // Cloudinary upload endpoint
  app.post('/api/admin/upload-cloudinary', authenticateAdmin, cloudinaryUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const folder = req.body.folder || 'ddcars';
      const result = await uploadToCloudinary(req.file.buffer, folder);
      
      console.log('Cloudinary upload successful:', result.secure_url);
      res.json(result);
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({ 
        message: 'Failed to upload to Cloudinary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get Cloudinary images
  app.get('/api/admin/cloudinary-images', authenticateAdmin, async (req, res) => {
    try {
      const folder = req.query.folder as string || 'ddcars';
      const images = await getCloudinaryImages(folder);
      res.json(images);
    } catch (error) {
      console.error('Failed to fetch Cloudinary images:', error);
      res.status(500).json({ message: 'Failed to fetch images' });
    }
  });

  // Delete Cloudinary image
  app.delete('/api/admin/cloudinary-images/:publicId', authenticateAdmin, async (req, res) => {
    try {
      const publicId = req.params.publicId;
      await deleteFromCloudinary(publicId);
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Failed to delete Cloudinary image:', error);
      res.status(500).json({ message: 'Failed to delete image' });
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

      const force = req.query.force === 'true';
      const result = await storage.deleteVehicle(id, force);
      
      if (!result.success) {
        if (result.error === 'RELATED_DATA_EXISTS') {
          return res.status(409).json({ 
            message: "Vehicle cannot be deleted - related data exists",
            details: `Vehicle heeft ${result.relatedData?.purchases || 0} aankoop(en), ${result.relatedData?.sales || 0} verkoop/verkopen en ${result.relatedData?.reservations || 0} reservering(en)`,
            relatedData: result.relatedData,
            canForceDelete: true
          });
        } else if (result.error === 'DATABASE_ERROR') {
          return res.status(500).json({ message: "Database error occurred" });
        } else {
          return res.status(404).json({ message: "Vehicle not found" });
        }
      }

      res.json({ 
        message: force ? "Vehicle and all related data deleted successfully" : "Vehicle deleted successfully" 
      });
    } catch (error) {
      console.error('Delete vehicle route error:', error);
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

  // Helper function to generate simple description from RDW data
  function generateDescription(vehicleData: any): string {
    const brand = vehicleData.merk || '';
    const model = vehicleData.handelsbenaming || vehicleData.type || '';
    const year = vehicleData.datum_eerste_toelating ? vehicleData.datum_eerste_toelating.substring(0, 4) : '';
    const fuel = vehicleData.brandstof_omschrijving || '';
    const power = vehicleData.vermogen_massarijklaar ? `${vehicleData.vermogen_massarijklaar} kW` : '';
    const doors = vehicleData.aantal_deuren || '';
    const seats = vehicleData.aantal_zitplaatsen || '';
    const transmission = vehicleData.inrichting || '';
    const color = vehicleData.eerste_kleur || '';
    const bodyType = vehicleData.voertuigsoort || '';
    
    // Generate simple specification-style description
    let description = `Algemene gegevens\n`;
    if (bodyType) description += `Carrosserievorm: ${bodyType}\n`;
    if (doors) description += `Aantal deuren: ${doors}\n`;
    if (fuel) description += `Brandstofsoort: ${fuel}\n`;
    if (year) description += `Bouwjaar: ${year}\n`;
    if (transmission) description += `Transmissie: ${transmission}\n`;
    if (color) description += `Kleur: ${color}\n`;
    if (seats) description += `Aantal zitplaatsen: ${seats}\n`;
    
    description += `\nTechnische gegevens\n`;
    if (power) description += `Vermogen: ${power}\n`;
    
    description += `\nEen ${brand} ${model} uit ${year}. Alle gegevens onder voorbehoud van typefouten.`;
    
    return description;
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
        
        // Better mileage extraction
        if (text.includes('kilometerstand') || text.includes('km-stand') || text.includes('kilometers')) {
          const kmMatch = nextText.match(/([\d.,]+)\s*km/i) || nextText.match(/([\d.,]+)/);
          if (kmMatch) {
            const mileageStr = kmMatch[1].replace(/[.,]/g, '');
            const mileageNum = parseInt(mileageStr);
            if (mileageNum > 0 && mileageNum < 2000000) { // Reasonable range
              carData.mileage = mileageNum;
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
      
      // Multiple patterns for mileage extraction if not found
      if (!carData.mileage || carData.mileage <= 10) {
        const mileagePatterns = [
          /(\d{1,3}(?:[.,]\d{3})*)\s*km(?:\s|$)/gi,
          /kilometerstand:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi,
          /km-stand:?\s*(\d{1,3}(?:[.,]\d{3})*)/gi,
          /(\d{1,3}(?:[.,]\d{3})*)\s*kilometers?/gi
        ];
        
        for (const pattern of mileagePatterns) {
          const match = fullText.match(pattern);
          if (match) {
            const mileageStr = match[0].match(/(\d{1,3}(?:[.,]\d{3})*)/);
            if (mileageStr) {
              const mileageNum = parseInt(mileageStr[1].replace(/[.,]/g, ''));
              if (mileageNum > 10 && mileageNum < 2000000) {
                carData.mileage = mileageNum;
                break;
              }
            }
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

      // Generate structured description like RDW data
      carData.description = generateMarktplaatsDescription(carData, title);
      
      // Extract original description as backup
      const originalDescription = $('.mp-listing-description').text().trim() || $('.description').text().trim() || $('[class*="description"]').text().trim();
      if (originalDescription && originalDescription.length > carData.description.length) {
        carData.description += `\n\n**Originele beschrijving:**\n${originalDescription}`;
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
      
      // Truth validation for extracted data
      const validationWarnings = validateMarktplaatsData(carData);
      
      // Debug logging
      console.log('Enhanced Marktplaats extraction result:', {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        fuel: carData.fuel,
        transmission: carData.transmission,
        color: carData.color,
        imageCount: carData.images.length,
        validationWarnings: validationWarnings,
        descriptionLength: carData.description ? carData.description.length : 0
      });
      console.log('Generated description preview:', carData.description ? carData.description.substring(0, 100) + '...' : 'NO DESCRIPTION');

      const responseData = {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        fuel: carData.fuel,
        transmission: carData.transmission,
        color: carData.color,
        description: carData.description,
        images: carData.images || [],
        validationWarnings: validationWarnings
      };

      console.log('Final API response data:', {
        ...responseData,
        description: responseData.description ? `${responseData.description.length} chars` : 'NULL'
      });

      res.json(responseData);
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

  // AI-Enhanced Marktplaats Import Endpoint (New)
  app.post('/api/admin/import-marktplaats-ai', authenticateAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || !url.includes('marktplaats.nl')) {
        return res.status(400).json({ error: 'Valid Marktplaats URL is required' });
      }

      console.log('AI-Enhanced Marktplaats import started for:', url);

      // Fetch the page content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      console.log('Marktplaats fetch status:', response.status, response.statusText);

      if (!response.ok) {
        return res.status(400).json({ 
          error: `Unable to fetch Marktplaats page. Status: ${response.status} ${response.statusText}` 
        });
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract all visible text content for AI analysis
      const visibleText = $('body').find('*').contents().filter(function() {
        return this.nodeType === 3; // Text nodes only
      }).map(function() {
        return $(this).text().trim();
      }).get().filter(text => text.length > 2).join('\n');

      // Clean and prepare text for AI analysis (limit to prevent token overflow)
      const cleanText = visibleText
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .substring(0, 12000) // Increased limit for comprehensive extraction
        .trim();

      console.log('Extracted text length for AI analysis:', cleanText.length);

      // Use Gemini AI to extract comprehensive car data like ChatGPT
      const aiPrompt = `Analyze this Dutch Marktplaats car listing and extract detailed vehicle information. Return ONLY a valid JSON object with comprehensive details.

LISTING CONTENT:
${cleanText}

Extract and structure all available information in this JSON format:
{
  "brand": "car brand name",
  "model": "complete model name and variant",
  "year": number,
  "price": "asking price without € symbol (numbers only)",
  "mileage": number,
  "fuel": "benzine/diesel/hybrid/elektrisch",
  "transmission": "automaat/handgeschakeld/semi-automaat",
  "color": "exterior color",
  "specifications": {
    "engine": "engine description with displacement",
    "power": "power in pk and/or kW",
    "torque": "torque if available",
    "acceleration": "0-100 km/h time if available",
    "topSpeed": "maximum speed if available",
    "consumption": "fuel consumption if available",
    "co2": "CO2 emissions if available",
    "energyLabel": "energy rating if available",
    "cylinders": "number of cylinders if available",
    "displacement": "engine displacement in cc or liters"
  },
  "features": {
    "safety": ["ABS", "ESP", "airbags", "etc if mentioned"],
    "exterior": ["alloy wheels", "sunroof", "etc if mentioned"],
    "interior": ["leather seats", "airco", "etc if mentioned"],
    "infotainment": ["navigation", "bluetooth", "etc if mentioned"]
  },
  "dimensions": {
    "doors": "number of doors if available",
    "seats": "number of seats if available",
    "weight": "weight if available",
    "length": "length if available",
    "width": "width if available",
    "height": "height if available"
  },
  "condition": {
    "apkUntil": "APK valid until date if mentioned",
    "owners": "number of previous owners if mentioned",
    "condition": "overall condition description if available"
  },
  "originalDescription": "the original sales text from the listing"
}

Important: Return ONLY the JSON object, no explanations or markdown formatting.`;

      console.log('Sending request to ChatGPT API...');

      // Call OpenAI ChatGPT API (the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user)
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert automotive data analyst. Extract detailed vehicle information from Dutch Marktplaats listings and return ONLY valid JSON with comprehensive details."
            },
            {
              role: "user", 
              content: aiPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        })
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.text();
        console.error('OpenAI API error response:', errorData);
        throw new Error(`ChatGPT API error: ${aiResponse.status} ${aiResponse.statusText}`);
      }

      const aiData = await aiResponse.json();
      const aiText = aiData.choices?.[0]?.message?.content;

      if (!aiText) {
        console.error('No content in ChatGPT response:', aiData);
        throw new Error('No response from ChatGPT service');
      }

      console.log('ChatGPT Response length:', aiText.length);

      // Parse ChatGPT response
      let carData;
      try {
        // ChatGPT with response_format json_object returns clean JSON
        carData = JSON.parse(aiText);
        console.log('ChatGPT successfully parsed car data:', Object.keys(carData));
      } catch (parseError) {
        console.error('Failed to parse ChatGPT response as JSON:', parseError);
        console.error('ChatGPT response preview:', aiText.substring(0, 500));
        throw new Error('ChatGPT returned invalid JSON format');
      }

      // Validate essential data
      if (!carData.brand || !carData.model) {
        throw new Error('ChatGPT could not extract basic vehicle information (brand/model missing)');
      }

      // Generate professional DD Cars description using structured data
      const ddDescription = generateEnhancedMarktplaatsDescription(carData);
      carData.description = ddDescription;
      
      // Truth validation
      const validationWarnings = validateMarktplaatsData(carData);
      
      console.log('ChatGPT Enhanced extraction result:', {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        price: carData.price,
        mileage: carData.mileage,
        hasSpecifications: !!carData.specifications && Object.keys(carData.specifications).length > 0,
        hasFeatures: !!carData.features && Object.keys(carData.features).length > 0,
        hasDimensions: !!carData.dimensions && Object.keys(carData.dimensions).length > 0,
        hasCondition: !!carData.condition && Object.keys(carData.condition).length > 0,
        validationWarnings: validationWarnings.length,
        descriptionLength: carData.description ? carData.description.length : 0
      });

      // Prepare comprehensive response
      const responseData = {
        brand: carData.brand,
        model: carData.model,
        year: carData.year || new Date().getFullYear(),
        price: carData.price || '',
        mileage: carData.mileage || 0,
        fuel: carData.fuel || '',
        transmission: carData.transmission || '',
        color: carData.color || '',
        description: carData.description,
        specifications: carData.specifications || {},
        features: carData.features || {},
        dimensions: carData.dimensions || {},
        condition: carData.condition || {},
        originalDescription: carData.originalDescription || '',
        images: [], // Images will be empty for now
        validationWarnings: validationWarnings,
        enhanced: true // Flag to indicate this is AI-enhanced data
      };

      console.log('Final ChatGPT-enhanced response structure:', {
        basicFields: ['brand', 'model', 'year', 'price', 'mileage', 'fuel', 'transmission', 'color'].filter(k => responseData[k as keyof typeof responseData]),
        enhancedFields: Object.keys(responseData.specifications).length + Object.keys(responseData.features).length + Object.keys(responseData.dimensions).length + Object.keys(responseData.condition).length,
        descriptionLength: responseData.description.length
      });

      res.json(responseData);
    } catch (error) {
      console.error('ChatGPT-Enhanced Marktplaats import error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('ChatGPT API')) {
          res.status(500).json({ 
            error: 'ChatGPT analysis failed. Please try the basic import instead.' 
          });
        } else if (error.message.includes('fetch')) {
          res.status(500).json({ 
            error: 'Network error: Unable to access Marktplaats URL.' 
          });
        } else {
          res.status(500).json({ 
            error: `ChatGPT Import failed: ${error.message}` 
          });
        }
      } else {
        res.status(500).json({ error: 'Failed to import car data with ChatGPT enhancement' });
      }
    }
  });

  // Enhanced description generator for AI-imported data
  function generateEnhancedMarktplaatsDescription(carData: any): string {
    let description = `Beschrijving\n\n`;
    
    // Algemene informatie section
    description += `Algemene informatie\n`;
    if (carData.year) description += `Bouwjaar: ${carData.year}\n`;
    if (carData.color) description += `Kleur: ${carData.color}\n`;
    if (carData.fuel) description += `Brandstof: ${carData.fuel}\n`;
    if (carData.transmission) description += `Transmissie: ${carData.transmission}\n`;
    if (carData.mileage) description += `Kilometerstand: ${carData.mileage.toLocaleString('nl-NL')} km\n`;
    if (carData.dimensions?.doors) description += `Aantal deuren: ${carData.dimensions.doors}\n`;
    if (carData.dimensions?.seats) description += `Aantal zitplaatsen: ${carData.dimensions.seats}\n`;
    
    // Technische gegevens section
    description += `\nTechnische gegevens\n`;
    description += `Merk: ${carData.brand}\n`;
    description += `Model: ${carData.model}\n`;
    if (carData.specifications?.engine) description += `Motor: ${carData.specifications.engine}\n`;
    if (carData.specifications?.power) description += `Vermogen: ${carData.specifications.power}\n`;
    if (carData.specifications?.torque) description += `Koppel: ${carData.specifications.torque}\n`;
    if (carData.specifications?.acceleration) description += `Acceleratie 0-100: ${carData.specifications.acceleration}\n`;
    if (carData.specifications?.topSpeed) description += `Topsnelheid: ${carData.specifications.topSpeed}\n`;
    if (carData.specifications?.consumption) description += `Verbruik: ${carData.specifications.consumption}\n`;
    if (carData.specifications?.co2) description += `CO2-uitstoot: ${carData.specifications.co2}\n`;
    if (carData.specifications?.energyLabel) description += `Energielabel: ${carData.specifications.energyLabel}\n`;
    
    // Uitrusting section if features are available
    if (carData.features && Object.keys(carData.features).length > 0) {
      description += `\nUitrusting en opties\n`;
      if (carData.features.safety?.length > 0) {
        description += `Veiligheid: ${carData.features.safety.join(', ')}\n`;
      }
      if (carData.features.exterior?.length > 0) {
        description += `Exterieur: ${carData.features.exterior.join(', ')}\n`;
      }
      if (carData.features.interior?.length > 0) {
        description += `Interieur: ${carData.features.interior.join(', ')}\n`;
      }
      if (carData.features.infotainment?.length > 0) {
        description += `Infotainment: ${carData.features.infotainment.join(', ')}\n`;
      }
    }
    
    // Staat section
    description += `\nStaat\n`;
    if (carData.condition?.condition) {
      description += `${carData.condition.condition}\n`;
    } else {
      description += `Optische staat: goed\n`;
      description += `Staat interieur: goed\n`;
    }
    if (carData.condition?.apkUntil) description += `APK geldig tot: ${carData.condition.apkUntil}\n`;
    if (carData.condition?.owners) description += `Aantal eigenaren: ${carData.condition.owners}\n`;
    
    // Financiële informatie section
    description += `\nFinanciële informatie\n`;
    if (carData.price) description += `Vraagprijs: €${parseInt(carData.price).toLocaleString('nl-NL')}\n`;
    description += `BTW/marge: BTW niet verrekenbaar voor ondernemers (margeregeling)\n`;
    
    // Original description if available
    if (carData.originalDescription) {
      description += `\nOriginele beschrijving\n`;
      description += `${carData.originalDescription}\n\n`;
    } else {
      description += `\nBeschrijving\n`;
      description += `${carData.brand} ${carData.model} uit ${carData.year}. Geïmporteerd van Marktplaats advertentie met AI-verrijking.\n\n`;
    }
    
    // DD Cars standard footer
    description += `Wij werken op afspraak graag even bellen voor vertrek.\n\n`;
    description += `Onze vraagprijzen zijn meeneemprijzen\n`;
    description += `Wanneer u uw auto wilt inruilen ontvangen wij graag de informatie van uw huidige auto om zo indicatief een voorstel te kunnen maken.\n`;
    description += `Ook heeft DD Cars verschillende financiering mogelijkheden en we doen u graag een voorstel.\n`;
    description += `Alle moeite is genomen om de informatie op deze internetsite zo accuraat en actueel mogelijk weer te geven.\n`;
    description += `Fouten zijn echter nooit uit te sluiten. Vertrouw daarom niet alleen op deze informatie, maar controleer bij aankoop de zaken die uw beslissing kunnen beïnvloeden.\n\n`;
    
    description += `DD Cars\n\n`;
    description += `Koekoekslaan 1A\n`;
    description += `1171PG Badhoevedorp\n`;
    description += `E-Mail: DD.Cars@hotmail.nl\n`;
    description += `Tel: 06 15 40 41 04\n`;
    
    return description;
  }

  // AI Description Restructure Endpoint
  app.post('/api/admin/restructure-description', authenticateAdmin, async (req, res) => {
    try {
      const { brand, model, year, fuel, transmission, color, description } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const prompt = `You are a professional automotive copywriter for DD Cars, a premium used car dealer in the Netherlands. 

Please restructure the following vehicle description into a professional, well-organized format in Dutch:

Vehicle: ${brand} ${model} ${year}
Fuel: ${fuel}
Transmission: ${transmission}  
Color: ${color}
Current description: ${description}

Create a professional description using this structure:
1. Start with a compelling title line with the brand, model, and year
2. "**Voertuig specificaties:**" section with bullet points for technical details
3. "**Conditie:**" section highlighting condition and maintenance
4. "**DD Cars Garantie:**" section with our service promises
5. End with a compelling conclusion and standard disclaimer

Keep the tone professional yet accessible, emphasize quality and reliability, and ensure all text is in proper Dutch. Use bullet points (•) for specifications and maintain consistent formatting.`;

      // Use Gemini API for restructuring
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const restructuredDescription = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!restructuredDescription) {
        throw new Error('No response from AI service');
      }

      res.json({ restructuredDescription });
    } catch (error) {
      console.error('AI restructure error:', error);
      res.status(500).json({ error: 'Failed to restructure description with AI' });
    }
  });

  // Truth validation function for Marktplaats imports
  function validateMarktplaatsData(carData: any): string[] {
    const warnings: string[] = [];
    
    // Validate year
    const currentYear = new Date().getFullYear();
    if (carData.year < 1980 || carData.year > currentYear + 1) {
      warnings.push(`Onrealistische bouwjaar: ${carData.year}`);
    }
    
    // Validate mileage
    if (carData.mileage < 10) {
      warnings.push(`Verdachte lage kilometerstand: ${carData.mileage} km`);
    } else if (carData.mileage > 500000) {
      warnings.push(`Zeer hoge kilometerstand: ${carData.mileage} km`);
    }
    
    // Validate price
    const price = parseInt(carData.price);
    if (price && (price < 500 || price > 200000)) {
      warnings.push(`Ongewone prijs: €${price.toLocaleString('nl-NL')}`);
    }
    
    // Check for missing critical data
    if (!carData.brand) warnings.push("Merk ontbreekt");
    if (!carData.model) warnings.push("Model ontbreekt");
    if (!carData.fuel) warnings.push("Brandstof ontbreekt");
    if (!carData.transmission) warnings.push("Transmissie ontbreekt");
    if (!carData.color) warnings.push("Kleur ontbreekt");
    
    // Validate fuel types
    const validFuels = ['benzine', 'diesel', 'hybrid', 'elektrisch', 'lpg'];
    if (carData.fuel && !validFuels.includes(carData.fuel.toLowerCase())) {
      warnings.push(`Onbekende brandstof: ${carData.fuel}`);
    }
    
    // Validate transmission types
    const validTransmissions = ['handgeschakeld', 'automaat', 'semi-automaat'];
    if (carData.transmission && !validTransmissions.includes(carData.transmission.toLowerCase())) {
      warnings.push(`Onbekende transmissie: ${carData.transmission}`);
    }
    
    return warnings;
  }

  // Helper function to generate structured description for Marktplaats imports
  function generateMarktplaatsDescription(carData: any, title: string): string {
    let description = `Beschrijving\n\n`;
    
    description += `Algemene informatie\n`;
    if (carData.year) description += `Bouwjaar: ${carData.year}\n`;
    if (carData.color) description += `Kleur: ${carData.color}\n`;
    if (carData.fuel) description += `Brandstof: ${carData.fuel}\n`;
    if (carData.transmission) description += `Transmissie: ${carData.transmission}\n`;
    if (carData.mileage) description += `Kilometerstand: ${carData.mileage.toLocaleString('nl-NL')} km\n`;
    
    description += `\nTechnische gegevens\n`;
    description += `Merk: ${carData.brand}\n`;
    description += `Model: ${carData.model}\n`;
    
    description += `\nStaat\n`;
    description += `Optische staat: goed\n`;
    description += `Staat interieur: goed\n`;
    
    description += `\nFinanciële informatie\n`;
    if (carData.price) description += `Vraagprijs: €${parseInt(carData.price).toLocaleString('nl-NL')}\n`;
    description += `BTW/marge: BTW niet verrekenbaar voor ondernemers (margeregeling)\n`;
    
    description += `\nBeschrijving\n`;
    description += `${carData.brand} ${carData.model} uit ${carData.year}. Geïmporteerd van Marktplaats advertentie.\n\n`;
    
    description += `Wij werken op afspraak graag even bellen voor vertrek.\n\n`;
    description += `Onze vraagprijzen zijn meeneemprijzen\n`;
    description += `Wanneer u uw auto wilt inruilen ontvangen wij graag de informatie van uw huidige auto om zo indicatief een voorstel te kunnen maken.\n`;
    description += `Ook heeft DD Cars verschillende financiering mogelijkheden en we doen u graag een voorstel.\n`;
    description += `Alle moeite is genomen om de informatie op deze internetsite zo accuraat en actueel mogelijk weer te geven.\n`;
    description += `Fouten zijn echter nooit uit te sluiten. Vertrouw daarom niet alleen op deze informatie, maar controleer bij aankoop de zaken die uw beslissing kunnen beïnvloeden.\n\n`;
    
    description += `DD Cars\n\n`;
    description += `Koekoekslaan 1A\n`;
    description += `1171PG Badhoevedorp\n`;
    description += `E-Mail: DD.Cars@hotmail.nl\n`;
    description += `Tel: 06 15 40 41 04\n`;
    
    return description;
  }

  // DDCars Sync Routes
  app.post("/api/admin/sync/vehicles", authenticateAdmin, async (req, res) => {
    try {
      const { DDCarsSyncService } = await import('./syncService');
      const syncService = new DDCarsSyncService(storage);
      
      const result = await syncService.syncVehiclesFromDDCars();
      
      res.json({
        message: "Vehicle sync completed",
        ...result
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({ 
        message: "Sync failed", 
        error: error.message 
      });
    }
  });

  app.post("/api/admin/sync/full", authenticateAdmin, async (req, res) => {
    try {
      const { DDCarsSyncService } = await import('./syncService');
      const syncService = new DDCarsSyncService(storage);
      
      const result = await syncService.performFullSync();
      
      res.json({
        message: "Full sync completed",
        ...result
      });
    } catch (error) {
      console.error('Full sync error:', error);
      res.status(500).json({ 
        message: "Full sync failed", 
        error: error.message 
      });
    }
  });

  // Auto-sync endpoint that can be called by ddcars.nl via webhook
  app.post("/api/sync/webhook", async (req, res) => {
    try {
      // Verify webhook authenticity (you might want to add a secret token)
      const { DDCarsSyncService } = await import('./syncService');
      const syncService = new DDCarsSyncService(storage);
      
      const result = await syncService.syncVehiclesFromDDCars();
      
      res.json({
        message: "Webhook sync completed",
        ...result
      });
    } catch (error) {
      console.error('Webhook sync error:', error);
      res.status(500).json({ 
        message: "Webhook sync failed", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
