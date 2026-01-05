import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  registerObjectStorageRoutes(app);

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

  // Update order payment status
  app.patch("/api/orders/:id/payment", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentStatus } = req.body;
      
      if (!paymentStatus || !["unpaid", "paid"].includes(paymentStatus)) {
        return res.status(400).json({ error: "Valid payment status required (unpaid or paid)" });
      }

      const order = await storage.updateOrderPaymentStatus(id, paymentStatus);
      
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
      const { fulfillmentStatus } = req.body;
      
      if (!fulfillmentStatus || !["unfulfilled", "fulfilled", "shipped", "delivered"].includes(fulfillmentStatus)) {
        return res.status(400).json({ error: "Valid fulfillment status required" });
      }

      const order = await storage.updateOrderFulfillmentStatus(id, fulfillmentStatus);
      
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
      const { archived } = req.body;
      
      if (typeof archived !== "boolean") {
        return res.status(400).json({ error: "Archived status (boolean) is required" });
      }

      const order = await storage.archiveOrder(id, archived);
      
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

  return httpServer;
}
