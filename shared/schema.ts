import { pgTable, text, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("active"),
  trackInventory: boolean("track_inventory").default(false),
  inventory: integer("inventory"),
  sku: text("sku"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingState: text("shipping_state"),
  shippingZip: text("shipping_zip").notNull(),
  repairDescription: text("repair_description"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("Pending"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  fulfillmentStatus: text("fulfillment_status").notNull().default("unfulfilled"),
  archived: boolean("archived").default(false),
  adminNotes: text("admin_notes"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  productPrice: decimal("product_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  paymentStatus: true,
  fulfillmentStatus: true,
  archived: true,
  adminNotes: true,
  trackingNumber: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type ProductImage = typeof productImages.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const serviceInquiries = pgTable("service_inquiries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("new"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceInquirySchema = createInsertSchema(serviceInquiries).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
});

export type InsertServiceInquiry = z.infer<typeof insertServiceInquirySchema>;
export type ServiceInquiry = typeof serviceInquiries.$inferSelect;
