import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertProductSchema, insertServiceInquirySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  registerObjectStorageRoutes(app);

  // ===== ADMIN AUTH =====
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        console.error("ADMIN_PASSWORD environment variable not set");
        return res.status(500).json({ error: "Admin authentication not configured" });
      }
      
      if (password === adminPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Error during admin auth:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // ===== PRODUCTS =====
  
  // Get all products (admin - includes all statuses)
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get active products only (storefront)
  app.get("/api/products/active", async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching active products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Create product
  app.post("/api/products", async (req, res) => {
    try {
      const productData = {
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        compareAtPrice: req.body.compareAtPrice ?? null,
        cost: req.body.cost ?? null,
        imageUrl: req.body.imageUrl,
        category: req.body.category,
        status: req.body.status ?? "active",
        trackInventory: req.body.trackInventory ?? false,
        inventory: req.body.inventory ?? null,
        sku: req.body.sku ?? null,
        tags: req.body.tags ?? null,
      };
      
      if (!productData.name || !productData.description || !productData.price || !productData.imageUrl || !productData.category) {
        return res.status(400).json({ error: "Missing required fields: name, description, price, imageUrl, category" });
      }
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product
  app.patch("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData: Record<string, any> = {};
      
      if (req.body.name !== undefined) productData.name = req.body.name;
      if (req.body.description !== undefined) productData.description = req.body.description;
      if (req.body.price !== undefined) productData.price = req.body.price;
      if (req.body.compareAtPrice !== undefined) productData.compareAtPrice = req.body.compareAtPrice;
      if (req.body.cost !== undefined) productData.cost = req.body.cost;
      if (req.body.imageUrl !== undefined) productData.imageUrl = req.body.imageUrl;
      if (req.body.category !== undefined) productData.category = req.body.category;
      if (req.body.status !== undefined) productData.status = req.body.status;
      if (req.body.trackInventory !== undefined) productData.trackInventory = req.body.trackInventory;
      if (req.body.inventory !== undefined) productData.inventory = req.body.inventory;
      if (req.body.sku !== undefined) productData.sku = req.body.sku;
      if (req.body.tags !== undefined) productData.tags = req.body.tags;
      
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ===== PRODUCT IMAGES =====

  // Get product images
  app.get("/api/products/:id/images", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const images = await storage.getProductImages(productId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching product images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Add product image
  app.post("/api/products/:id/images", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { url, altText, sortOrder } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "Image URL is required" });
      }
      
      const image = await storage.addProductImage(productId, url, altText, sortOrder);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error adding product image:", error);
      res.status(500).json({ error: "Failed to add image" });
    }
  });

  // Update product image
  app.patch("/api/product-images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { url, altText, sortOrder } = req.body;
      
      const image = await storage.updateProductImage(id, { url, altText, sortOrder });
      
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      console.error("Error updating product image:", error);
      res.status(500).json({ error: "Failed to update image" });
    }
  });

  // Delete product image
  app.delete("/api/product-images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProductImage(id);
      
      if (!success) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Reorder product images
  app.post("/api/products/:id/images/reorder", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { imageIds } = req.body;
      
      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ error: "imageIds array is required" });
      }
      
      await storage.reorderProductImages(productId, imageIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering images:", error);
      res.status(500).json({ error: "Failed to reorder images" });
    }
  });

  // ===== ORDERS =====
  
  // Get all orders (with optional archive filter)
  app.get("/api/orders", async (req, res) => {
    try {
      const includeArchived = req.query.includeArchived === "true";
      const orders = await storage.getAllOrders(includeArchived);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Create order (checkout)
  app.post("/api/orders", async (req, res) => {
    try {
      const { order, items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order must contain at least one item" });
      }

      const createdOrder = await storage.createOrder(order, items);
      res.status(201).json(createdOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Update order status
  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== "string") {
        return res.status(400).json({ error: "Status is required" });
      }

      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Update order tracking number
  app.patch("/api/orders/:id/tracking", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { trackingNumber } = req.body;

      const order = await storage.updateOrderTracking(id, trackingNumber || "");
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating tracking number:", error);
      res.status(500).json({ error: "Failed to update tracking number" });
    }
  });

  // Validation schemas for order updates
  const paymentStatusSchema = z.enum(["unpaid", "paid"]);
  const fulfillmentStatusSchema = z.enum(["unfulfilled", "shipped", "delivered", "fulfilled"]);

  // Update order payment status
  app.patch("/api/orders/:id/payment", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = paymentStatusSchema.safeParse(req.body.paymentStatus);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Valid payment status required (unpaid or paid)" });
      }

      const order = await storage.updateOrderPaymentStatus(id, parseResult.data);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  // Update order fulfillment status
  app.patch("/api/orders/:id/fulfillment", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = fulfillmentStatusSchema.safeParse(req.body.fulfillmentStatus);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Valid fulfillment status required (unfulfilled, shipped, delivered, fulfilled)" });
      }

      const order = await storage.updateOrderFulfillmentStatus(id, parseResult.data);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating fulfillment status:", error);
      res.status(500).json({ error: "Failed to update fulfillment status" });
    }
  });

  // Update order admin notes
  app.patch("/api/orders/:id/notes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminNotes } = req.body;

      const order = await storage.updateOrderNotes(id, adminNotes || "");
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating admin notes:", error);
      res.status(500).json({ error: "Failed to update admin notes" });
    }
  });

  // Archive/unarchive order
  app.patch("/api/orders/:id/archive", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const archivedResult = z.boolean().safeParse(req.body.archived);
      
      if (!archivedResult.success) {
        return res.status(400).json({ error: "Archived status (boolean) is required" });
      }

      const order = await storage.archiveOrder(id, archivedResult.data);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating archive status:", error);
      res.status(500).json({ error: "Failed to update archive status" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // ===== SERVICE INQUIRIES =====

  // Get all service inquiries (admin)
  app.get("/api/service-inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getAllServiceInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching service inquiries:", error);
      res.status(500).json({ error: "Failed to fetch service inquiries" });
    }
  });

  // Get service inquiry by ID
  app.get("/api/service-inquiries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inquiry = await storage.getServiceInquiryById(id);
      
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      res.status(500).json({ error: "Failed to fetch inquiry" });
    }
  });

  // Create service inquiry (public - from Services page form)
  app.post("/api/service-inquiries", async (req, res) => {
    try {
      const parseResult = insertServiceInquirySchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid inquiry data", details: parseResult.error.errors });
      }

      const inquiry = await storage.createServiceInquiry(parseResult.data);
      res.status(201).json(inquiry);
    } catch (error) {
      console.error("Error creating service inquiry:", error);
      res.status(500).json({ error: "Failed to create inquiry" });
    }
  });

  // Update inquiry status (admin)
  const inquiryStatusSchema = z.enum(["new", "in-progress", "closed"]);

  app.patch("/api/service-inquiries/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parseResult = inquiryStatusSchema.safeParse(req.body.status);
      
      if (!parseResult.success) {
        return res.status(400).json({ error: "Valid status required (new, in-progress, closed)" });
      }

      const inquiry = await storage.updateServiceInquiryStatus(id, parseResult.data);
      
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({ error: "Failed to update inquiry status" });
    }
  });

  // Update inquiry notes (admin)
  app.patch("/api/service-inquiries/:id/notes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { adminNotes } = req.body;

      const inquiry = await storage.updateServiceInquiryNotes(id, adminNotes || "");
      
      if (!inquiry) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      console.error("Error updating inquiry notes:", error);
      res.status(500).json({ error: "Failed to update inquiry notes" });
    }
  });

  // Delete service inquiry (admin)
  app.delete("/api/service-inquiries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteServiceInquiry(id);
      
      if (!success) {
        return res.status(404).json({ error: "Inquiry not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      res.status(500).json({ error: "Failed to delete inquiry" });
    }
  });

  return httpServer;
}
