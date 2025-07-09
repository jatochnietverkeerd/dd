import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertVehicleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
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

  const httpServer = createServer(app);
  return httpServer;
}
