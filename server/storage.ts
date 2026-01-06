import { eq, desc, and, not } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import type { 
  Product, 
  InsertProduct, 
  ProductImage,
  Order, 
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  ServiceInquiry,
  InsertServiceInquiry,
  ProductOption,
  InsertProductOption,
  ProductVariant,
  InsertProductVariant
} from "@shared/schema";

const { Pool } = pg;

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Product Images
  getProductImages(productId: number): Promise<ProductImage[]>;
  addProductImage(productId: number, url: string, altText?: string, sortOrder?: number): Promise<ProductImage>;
  updateProductImage(id: number, data: { url?: string; altText?: string; sortOrder?: number }): Promise<ProductImage | undefined>;
  deleteProductImage(id: number): Promise<boolean>;
  reorderProductImages(productId: number, imageIds: number[]): Promise<void>;

  // Orders
  getAllOrders(includeArchived?: boolean): Promise<(Order & { items: OrderItem[] })[]>;
  getOrderById(id: number): Promise<(Order & { items: OrderItem[] }) | undefined>;
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order | undefined>;
  updateOrderFulfillmentStatus(id: number, fulfillmentStatus: string): Promise<Order | undefined>;
  updateOrderTracking(id: number, trackingNumber: string): Promise<Order | undefined>;
  updateOrderNotes(id: number, adminNotes: string): Promise<Order | undefined>;
  archiveOrder(id: number, archived: boolean): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Service Inquiries
  getAllServiceInquiries(): Promise<ServiceInquiry[]>;
  getServiceInquiryById(id: number): Promise<ServiceInquiry | undefined>;
  createServiceInquiry(inquiry: InsertServiceInquiry): Promise<ServiceInquiry>;
  updateServiceInquiryStatus(id: number, status: string): Promise<ServiceInquiry | undefined>;
  updateServiceInquiryNotes(id: number, adminNotes: string): Promise<ServiceInquiry | undefined>;
  deleteServiceInquiry(id: number): Promise<boolean>;

  // Product Options
  getProductOptions(productId: number): Promise<ProductOption[]>;
  createProductOption(option: InsertProductOption): Promise<ProductOption>;
  updateProductOption(id: number, data: Partial<InsertProductOption>): Promise<ProductOption | undefined>;
  deleteProductOption(id: number): Promise<boolean>;
  deleteAllProductOptions(productId: number): Promise<boolean>;

  // Product Variants
  getProductVariants(productId: number): Promise<ProductVariant[]>;
  getProductVariantById(id: number): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: number, data: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteProductVariant(id: number): Promise<boolean>;
  deleteAllProductVariants(productId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    console.log(`[DB] Connecting to database, URL starts with: ${dbUrl?.substring(0, 30)}...`);
    const pool = new Pool({
      connectionString: dbUrl!,
    });
    this.db = drizzle(pool, { schema });
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return this.db.select().from(schema.products).orderBy(desc(schema.products.createdAt));
  }

  async getActiveProducts(): Promise<Product[]> {
    return this.db.select().from(schema.products)
      .where(eq(schema.products.status, "active"))
      .orderBy(desc(schema.products.createdAt));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const results = await this.db.select().from(schema.products).where(eq(schema.products.id, id));
    return results[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const results = await this.db.insert(schema.products).values(product).returning();
    return results[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const results = await this.db
      .update(schema.products)
      .set(product)
      .where(eq(schema.products.id, id))
      .returning();
    return results[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.products).where(eq(schema.products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product Images
  async getProductImages(productId: number): Promise<ProductImage[]> {
    return this.db.select().from(schema.productImages)
      .where(eq(schema.productImages.productId, productId))
      .orderBy(schema.productImages.sortOrder);
  }

  async addProductImage(productId: number, url: string, altText?: string, sortOrder?: number): Promise<ProductImage> {
    const maxOrder = await this.db.select().from(schema.productImages)
      .where(eq(schema.productImages.productId, productId))
      .orderBy(desc(schema.productImages.sortOrder))
      .limit(1);
    
    const newSortOrder = sortOrder ?? (maxOrder[0]?.sortOrder ?? -1) + 1;
    
    const results = await this.db.insert(schema.productImages).values({
      productId,
      url,
      altText,
      sortOrder: newSortOrder,
    }).returning();
    return results[0];
  }

  async updateProductImage(id: number, data: { url?: string; altText?: string; sortOrder?: number }): Promise<ProductImage | undefined> {
    const results = await this.db.update(schema.productImages)
      .set(data)
      .where(eq(schema.productImages.id, id))
      .returning();
    return results[0];
  }

  async deleteProductImage(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.productImages).where(eq(schema.productImages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderProductImages(productId: number, imageIds: number[]): Promise<void> {
    for (let i = 0; i < imageIds.length; i++) {
      await this.db.update(schema.productImages)
        .set({ sortOrder: i })
        .where(eq(schema.productImages.id, imageIds[i]));
    }
  }

  // Orders
  async getAllOrders(includeArchived: boolean = false): Promise<(Order & { items: OrderItem[] })[]> {
    let query = this.db.select().from(schema.orders);
    
    if (!includeArchived) {
      query = query.where(eq(schema.orders.archived, false)) as typeof query;
    }
    
    const orders = await query.orderBy(desc(schema.orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await this.db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, order.id));
        return { ...order, items };
      })
    );

    return ordersWithItems;
  }

  async getOrderById(id: number): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const results = await this.db.select().from(schema.orders).where(eq(schema.orders.id, id));
    if (results.length === 0) return undefined;

    const items = await this.db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id));

    return { ...results[0], items };
  }

  async createOrder(
    order: InsertOrder, 
    items: Omit<InsertOrderItem, "orderId">[]
  ): Promise<Order> {
    const orderResults = await this.db.insert(schema.orders).values(order).returning();
    const createdOrder = orderResults[0];

    const orderItemsWithId = items.map(item => ({
      ...item,
      orderId: createdOrder.id,
    }));

    await this.db.insert(schema.orderItems).values(orderItemsWithId);

    return createdOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const results = await this.db
      .update(schema.orders)
      .set({ status })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async updateOrderTracking(id: number, trackingNumber: string): Promise<Order | undefined> {
    const results = await this.db
      .update(schema.orders)
      .set({ trackingNumber, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order | undefined> {
    const results = await this.db
      .update(schema.orders)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async updateOrderFulfillmentStatus(id: number, fulfillmentStatus: string): Promise<Order | undefined> {
    const results = await this.db
      .update(schema.orders)
      .set({ fulfillmentStatus, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async updateOrderNotes(id: number, adminNotes: string): Promise<Order | undefined> {
    const results = await this.db
      .update(schema.orders)
      .set({ adminNotes, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async archiveOrder(id: number, archived: boolean): Promise<Order | undefined> {
    const results = await this.db
      .update(schema.orders)
      .set({ archived, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async deleteOrder(id: number): Promise<boolean> {
    const results = await this.db
      .delete(schema.orders)
      .where(eq(schema.orders.id, id))
      .returning();
    return results.length > 0;
  }

  // Service Inquiries
  async getAllServiceInquiries(): Promise<ServiceInquiry[]> {
    return this.db.select().from(schema.serviceInquiries).orderBy(desc(schema.serviceInquiries.createdAt));
  }

  async getServiceInquiryById(id: number): Promise<ServiceInquiry | undefined> {
    const results = await this.db.select().from(schema.serviceInquiries).where(eq(schema.serviceInquiries.id, id));
    return results[0];
  }

  async createServiceInquiry(inquiry: InsertServiceInquiry): Promise<ServiceInquiry> {
    const results = await this.db.insert(schema.serviceInquiries).values(inquiry).returning();
    return results[0];
  }

  async updateServiceInquiryStatus(id: number, status: string): Promise<ServiceInquiry | undefined> {
    const results = await this.db
      .update(schema.serviceInquiries)
      .set({ status })
      .where(eq(schema.serviceInquiries.id, id))
      .returning();
    return results[0];
  }

  async updateServiceInquiryNotes(id: number, adminNotes: string): Promise<ServiceInquiry | undefined> {
    const results = await this.db
      .update(schema.serviceInquiries)
      .set({ adminNotes })
      .where(eq(schema.serviceInquiries.id, id))
      .returning();
    return results[0];
  }

  async deleteServiceInquiry(id: number): Promise<boolean> {
    const results = await this.db
      .delete(schema.serviceInquiries)
      .where(eq(schema.serviceInquiries.id, id))
      .returning();
    return results.length > 0;
  }

  // Product Options
  async getProductOptions(productId: number): Promise<ProductOption[]> {
    return this.db.select().from(schema.productOptions)
      .where(eq(schema.productOptions.productId, productId))
      .orderBy(schema.productOptions.position);
  }

  async createProductOption(option: InsertProductOption): Promise<ProductOption> {
    const results = await this.db.insert(schema.productOptions).values(option).returning();
    return results[0];
  }

  async updateProductOption(id: number, data: Partial<InsertProductOption>): Promise<ProductOption | undefined> {
    const results = await this.db
      .update(schema.productOptions)
      .set(data)
      .where(eq(schema.productOptions.id, id))
      .returning();
    return results[0];
  }

  async deleteProductOption(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.productOptions).where(eq(schema.productOptions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteAllProductOptions(productId: number): Promise<boolean> {
    await this.db.delete(schema.productOptions).where(eq(schema.productOptions.productId, productId));
    return true;
  }

  // Product Variants - with consistent JSON parsing
  private parseVariantForApi(variant: ProductVariant): ProductVariant {
    let parsedOptionValues: Record<string, string> = {};
    try {
      parsedOptionValues = typeof variant.optionValues === 'string' 
        ? JSON.parse(variant.optionValues) 
        : (variant.optionValues as Record<string, string> || {});
    } catch {
      parsedOptionValues = {};
    }
    return {
      ...variant,
      optionValues: JSON.stringify(parsedOptionValues),
    };
  }

  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    const variants = await this.db.select().from(schema.productVariants)
      .where(eq(schema.productVariants.productId, productId))
      .orderBy(schema.productVariants.createdAt);
    return variants.map(v => this.parseVariantForApi(v));
  }

  async getProductVariantById(id: number): Promise<ProductVariant | undefined> {
    const results = await this.db.select().from(schema.productVariants).where(eq(schema.productVariants.id, id));
    return results[0] ? this.parseVariantForApi(results[0]) : undefined;
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const normalizedVariant = {
      ...variant,
      optionValues: typeof variant.optionValues === 'string' 
        ? variant.optionValues 
        : JSON.stringify(variant.optionValues || {}),
    };
    const results = await this.db.insert(schema.productVariants).values(normalizedVariant).returning();
    return this.parseVariantForApi(results[0]);
  }

  async updateProductVariant(id: number, data: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const normalizedData = { ...data };
    if (data.optionValues !== undefined) {
      normalizedData.optionValues = typeof data.optionValues === 'string' 
        ? data.optionValues 
        : JSON.stringify(data.optionValues || {});
    }
    const results = await this.db
      .update(schema.productVariants)
      .set(normalizedData)
      .where(eq(schema.productVariants.id, id))
      .returning();
    return results[0] ? this.parseVariantForApi(results[0]) : undefined;
  }

  async deleteProductVariant(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.productVariants).where(eq(schema.productVariants.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteAllProductVariants(productId: number): Promise<boolean> {
    await this.db.delete(schema.productVariants).where(eq(schema.productVariants.productId, productId));
    return true;
  }
}

export const storage = new DatabaseStorage();
