import { eq, desc, and, not, or, isNull } from "drizzle-orm";
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
  InsertProductVariant,
  Review,
  InsertReview,
  SiteContent,
  InsertSiteContent
} from "@shared/schema";

const { Pool } = pg;

export interface IStorage {
  // Products
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getGalleryProducts(): Promise<Product[]>;
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
  getOrderItems(orderId: number): Promise<OrderItem[]>;
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

  // Reviews
  getAllReviews(): Promise<Review[]>;
  getFeaturedReviews(): Promise<Review[]>;
  getPublishedReviews(): Promise<Review[]>;
  getReviewById(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;

  // Site Content
  getSiteContentByKey(key: string): Promise<SiteContent | undefined>;
  getAllSiteContent(): Promise<SiteContent[]>;
  upsertSiteContent(data: InsertSiteContent): Promise<SiteContent>;
}

export class DatabaseStorage implements IStorage {
  private db: ReturnType<typeof drizzle> | null = null;
  private pool: InstanceType<typeof Pool> | null = null;
  private migrationComplete: Promise<void> | null = null;
  private initialized = false;

  private ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true; // Set flag first to prevent recursion
    
    const dbUrl = process.env.DATABASE_URL;
    console.log(`[DB] Connecting to database, URL starts with: ${dbUrl?.substring(0, 30)}...`);
    this.pool = new Pool({
      connectionString: dbUrl!,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
    this.db = drizzle(this.pool, { schema });
    this.migrationComplete = this.runMigrations();
  }
  
  private getDb(): ReturnType<typeof drizzle> {
    this.ensureInitialized();
    return this.db!;
  }
  
  private getPool(): InstanceType<typeof Pool> {
    this.ensureInitialized();
    return this.pool!;
  }
  
  private getMigrationComplete(): Promise<void> {
    this.ensureInitialized();
    return this.migrationComplete!;
  }

  private async runMigrations(): Promise<void> {
    console.log('[DB] Running automatic migrations...');
    const client = await this.pool!.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          compare_at_price NUMERIC(10,2),
          cost NUMERIC(10,2),
          image_url TEXT NOT NULL,
          category TEXT NOT NULL,
          product_type TEXT,
          brand TEXT,
          color TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          track_inventory BOOLEAN DEFAULT true,
          inventory INTEGER,
          sku TEXT,
          tags TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS product_images (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          alt_text TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT,
          shipping_address TEXT NOT NULL,
          shipping_city TEXT NOT NULL,
          shipping_state TEXT,
          shipping_zip TEXT NOT NULL,
          repair_description TEXT,
          total NUMERIC(10,2) NOT NULL,
          shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'Pending',
          payment_status TEXT NOT NULL DEFAULT 'unpaid',
          fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
          archived BOOLEAN DEFAULT false,
          admin_notes TEXT,
          tracking_number TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          product_name TEXT NOT NULL,
          product_price NUMERIC(10,2) NOT NULL,
          quantity INTEGER NOT NULL
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS service_inquiries (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT,
          service_type TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          admin_notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS product_options (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          "values" TEXT[] NOT NULL,
          position INTEGER NOT NULL DEFAULT 0
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS product_variants (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          option_values TEXT NOT NULL,
          sku TEXT,
          price NUMERIC(10,2) NOT NULL,
          compare_at_price NUMERIC(10,2),
          cost NUMERIC(10,2),
          track_inventory BOOLEAN DEFAULT true,
          inventory INTEGER,
          image_url TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          customer_name TEXT NOT NULL,
          customer_location TEXT NOT NULL,
          rating INTEGER NOT NULL DEFAULT 5,
          content TEXT NOT NULL,
          image_url TEXT,
          featured BOOLEAN DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      const columnMigrations = [
        { table: 'products', column: 'track_inventory', type: 'BOOLEAN DEFAULT true' },
        { table: 'products', column: 'inventory', type: 'INTEGER' },
        { table: 'orders', column: 'shipping_state', type: 'TEXT' },
        { table: 'orders', column: 'archived', type: 'BOOLEAN DEFAULT false' },
        { table: 'orders', column: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' },
        { table: 'orders', column: 'delivery_method', type: "TEXT NOT NULL DEFAULT 'shipping'" },
        { table: 'order_items', column: 'variant_id', type: 'INTEGER' },
        { table: 'reviews', column: 'published', type: 'BOOLEAN DEFAULT false' },
        { table: 'products', column: 'in_store_only', type: 'BOOLEAN DEFAULT false' },
      ];

      for (const migration of columnMigrations) {
        try {
          await client.query(`ALTER TABLE ${migration.table} ADD COLUMN IF NOT EXISTS ${migration.column} ${migration.type}`);
        } catch (e) {
          console.log(`[DB] Column ${migration.column} may already exist`);
        }
      }

      // Backfill existing products with NULL in_store_only to false
      await client.query(`UPDATE products SET in_store_only = false WHERE in_store_only IS NULL`);

      console.log('[DB] Migrations completed successfully');
    } catch (error) {
      console.error('[DB] Migration error:', error);
    } finally {
      client.release();
    }
  }

  async waitForMigrations(): Promise<void> {
    await this.getMigrationComplete();
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return this.getDb().select().from(schema.products).orderBy(desc(schema.products.createdAt));
  }

  async getActiveProducts(): Promise<Product[]> {
    return this.getDb().select().from(schema.products)
      .where(and(
        eq(schema.products.status, "active"),
        or(eq(schema.products.inStoreOnly, false), isNull(schema.products.inStoreOnly))
      ))
      .orderBy(desc(schema.products.createdAt));
  }

  async getGalleryProducts(): Promise<Product[]> {
    return this.getDb().select().from(schema.products)
      .where(and(
        eq(schema.products.status, "active"),
        eq(schema.products.inStoreOnly, true)
      ))
      .orderBy(desc(schema.products.createdAt));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const results = await this.getDb().select().from(schema.products).where(eq(schema.products.id, id));
    return results[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const results = await this.getDb().insert(schema.products).values(product).returning();
    return results[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const results = await this.getDb()
      .update(schema.products)
      .set(product)
      .where(eq(schema.products.id, id))
      .returning();
    return results[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await this.getDb().delete(schema.products).where(eq(schema.products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Product Images
  async getProductImages(productId: number): Promise<ProductImage[]> {
    return this.getDb().select().from(schema.productImages)
      .where(eq(schema.productImages.productId, productId))
      .orderBy(schema.productImages.sortOrder);
  }

  async addProductImage(productId: number, url: string, altText?: string, sortOrder?: number): Promise<ProductImage> {
    const maxOrder = await this.getDb().select().from(schema.productImages)
      .where(eq(schema.productImages.productId, productId))
      .orderBy(desc(schema.productImages.sortOrder))
      .limit(1);
    
    const newSortOrder = sortOrder ?? (maxOrder[0]?.sortOrder ?? -1) + 1;
    
    const results = await this.getDb().insert(schema.productImages).values({
      productId,
      url,
      altText,
      sortOrder: newSortOrder,
    }).returning();
    return results[0];
  }

  async updateProductImage(id: number, data: { url?: string; altText?: string; sortOrder?: number }): Promise<ProductImage | undefined> {
    const results = await this.getDb().update(schema.productImages)
      .set(data)
      .where(eq(schema.productImages.id, id))
      .returning();
    return results[0];
  }

  async deleteProductImage(id: number): Promise<boolean> {
    const result = await this.getDb().delete(schema.productImages).where(eq(schema.productImages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderProductImages(productId: number, imageIds: number[]): Promise<void> {
    for (let i = 0; i < imageIds.length; i++) {
      await this.getDb().update(schema.productImages)
        .set({ sortOrder: i })
        .where(eq(schema.productImages.id, imageIds[i]));
    }
  }

  // Orders
  async getAllOrders(includeArchived: boolean = false): Promise<(Order & { items: OrderItem[] })[]> {
    let query = this.getDb().select().from(schema.orders);
    
    if (!includeArchived) {
      query = query.where(eq(schema.orders.archived, false)) as typeof query;
    }
    
    const orders = await query.orderBy(desc(schema.orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await this.getDb()
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, order.id));
        return { ...order, items };
      })
    );

    return ordersWithItems;
  }

  async getOrderById(id: number): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const results = await this.getDb().select().from(schema.orders).where(eq(schema.orders.id, id));
    if (results.length === 0) return undefined;

    const items = await this.getDb()
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id));

    return { ...results[0], items };
  }

  async createOrder(
    order: InsertOrder, 
    items: Omit<InsertOrderItem, "orderId">[]
  ): Promise<Order> {
    const orderResults = await this.getDb().insert(schema.orders).values(order).returning();
    const createdOrder = orderResults[0];

    const orderItemsWithId = items.map(item => ({
      ...item,
      orderId: createdOrder.id,
    }));

    await this.getDb().insert(schema.orderItems).values(orderItemsWithId);

    return createdOrder;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.getDb().select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const results = await this.getDb()
      .update(schema.orders)
      .set({ status })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async updateOrderTracking(id: number, trackingNumber: string): Promise<Order | undefined> {
    const results = await this.getDb()
      .update(schema.orders)
      .set({ trackingNumber, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order | undefined> {
    const results = await this.getDb()
      .update(schema.orders)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async updateOrderFulfillmentStatus(id: number, fulfillmentStatus: string): Promise<Order | undefined> {
    const results = await this.getDb()
      .update(schema.orders)
      .set({ fulfillmentStatus, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async updateOrderNotes(id: number, adminNotes: string): Promise<Order | undefined> {
    const results = await this.getDb()
      .update(schema.orders)
      .set({ adminNotes, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async archiveOrder(id: number, archived: boolean): Promise<Order | undefined> {
    const results = await this.getDb()
      .update(schema.orders)
      .set({ archived, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }

  async deleteOrder(id: number): Promise<boolean> {
    const results = await this.getDb()
      .delete(schema.orders)
      .where(eq(schema.orders.id, id))
      .returning();
    return results.length > 0;
  }

  // Service Inquiries
  async getAllServiceInquiries(): Promise<ServiceInquiry[]> {
    return this.getDb().select().from(schema.serviceInquiries).orderBy(desc(schema.serviceInquiries.createdAt));
  }

  async getServiceInquiryById(id: number): Promise<ServiceInquiry | undefined> {
    const results = await this.getDb().select().from(schema.serviceInquiries).where(eq(schema.serviceInquiries.id, id));
    return results[0];
  }

  async createServiceInquiry(inquiry: InsertServiceInquiry): Promise<ServiceInquiry> {
    const results = await this.getDb().insert(schema.serviceInquiries).values(inquiry).returning();
    return results[0];
  }

  async updateServiceInquiryStatus(id: number, status: string): Promise<ServiceInquiry | undefined> {
    const results = await this.getDb()
      .update(schema.serviceInquiries)
      .set({ status })
      .where(eq(schema.serviceInquiries.id, id))
      .returning();
    return results[0];
  }

  async updateServiceInquiryNotes(id: number, adminNotes: string): Promise<ServiceInquiry | undefined> {
    const results = await this.getDb()
      .update(schema.serviceInquiries)
      .set({ adminNotes })
      .where(eq(schema.serviceInquiries.id, id))
      .returning();
    return results[0];
  }

  async deleteServiceInquiry(id: number): Promise<boolean> {
    const results = await this.getDb()
      .delete(schema.serviceInquiries)
      .where(eq(schema.serviceInquiries.id, id))
      .returning();
    return results.length > 0;
  }

  // Product Options
  async getProductOptions(productId: number): Promise<ProductOption[]> {
    return this.getDb().select().from(schema.productOptions)
      .where(eq(schema.productOptions.productId, productId))
      .orderBy(schema.productOptions.position);
  }

  async createProductOption(option: InsertProductOption): Promise<ProductOption> {
    const results = await this.getDb().insert(schema.productOptions).values(option).returning();
    return results[0];
  }

  async updateProductOption(id: number, data: Partial<InsertProductOption>): Promise<ProductOption | undefined> {
    const results = await this.getDb()
      .update(schema.productOptions)
      .set(data)
      .where(eq(schema.productOptions.id, id))
      .returning();
    return results[0];
  }

  async deleteProductOption(id: number): Promise<boolean> {
    const result = await this.getDb().delete(schema.productOptions).where(eq(schema.productOptions.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteAllProductOptions(productId: number): Promise<boolean> {
    await this.getDb().delete(schema.productOptions).where(eq(schema.productOptions.productId, productId));
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
    const variants = await this.getDb().select().from(schema.productVariants)
      .where(eq(schema.productVariants.productId, productId))
      .orderBy(schema.productVariants.createdAt);
    return variants.map(v => this.parseVariantForApi(v));
  }

  async getProductVariantById(id: number): Promise<ProductVariant | undefined> {
    const results = await this.getDb().select().from(schema.productVariants).where(eq(schema.productVariants.id, id));
    return results[0] ? this.parseVariantForApi(results[0]) : undefined;
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const normalizedVariant = {
      ...variant,
      optionValues: typeof variant.optionValues === 'string' 
        ? variant.optionValues 
        : JSON.stringify(variant.optionValues || {}),
    };
    const results = await this.getDb().insert(schema.productVariants).values(normalizedVariant).returning();
    return this.parseVariantForApi(results[0]);
  }

  async updateProductVariant(id: number, data: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const normalizedData = { ...data };
    if (data.optionValues !== undefined) {
      normalizedData.optionValues = typeof data.optionValues === 'string' 
        ? data.optionValues 
        : JSON.stringify(data.optionValues || {});
    }
    const results = await this.getDb()
      .update(schema.productVariants)
      .set(normalizedData)
      .where(eq(schema.productVariants.id, id))
      .returning();
    return results[0] ? this.parseVariantForApi(results[0]) : undefined;
  }

  async deleteProductVariant(id: number): Promise<boolean> {
    const result = await this.getDb().delete(schema.productVariants).where(eq(schema.productVariants.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteAllProductVariants(productId: number): Promise<boolean> {
    await this.getDb().delete(schema.productVariants).where(eq(schema.productVariants.productId, productId));
    return true;
  }

  // Reviews
  async getAllReviews(): Promise<Review[]> {
    return this.getDb().select().from(schema.reviews).orderBy(desc(schema.reviews.createdAt));
  }

  async getFeaturedReviews(): Promise<Review[]> {
    return this.getDb().select().from(schema.reviews)
      .where(eq(schema.reviews.featured, true))
      .orderBy(desc(schema.reviews.createdAt));
  }

  async getPublishedReviews(): Promise<Review[]> {
    return this.getDb().select().from(schema.reviews)
      .where(eq(schema.reviews.published, true))
      .orderBy(desc(schema.reviews.createdAt))
      .limit(6);
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    const results = await this.getDb().select().from(schema.reviews).where(eq(schema.reviews.id, id));
    return results[0];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const results = await this.getDb().insert(schema.reviews).values(review).returning();
    return results[0];
  }

  async updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined> {
    const results = await this.getDb()
      .update(schema.reviews)
      .set(data)
      .where(eq(schema.reviews.id, id))
      .returning();
    return results[0];
  }

  async deleteReview(id: number): Promise<boolean> {
    const result = await this.getDb().delete(schema.reviews).where(eq(schema.reviews.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Site Content methods
  async getSiteContentByKey(key: string): Promise<SiteContent | undefined> {
    const results = await this.getDb().select().from(schema.siteContent).where(eq(schema.siteContent.key, key));
    return results[0];
  }

  async getAllSiteContent(): Promise<SiteContent[]> {
    return this.getDb().select().from(schema.siteContent);
  }

  async upsertSiteContent(data: InsertSiteContent): Promise<SiteContent> {
    const existing = await this.getSiteContentByKey(data.key);
    if (existing) {
      const results = await this.getDb()
        .update(schema.siteContent)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.siteContent.key, data.key))
        .returning();
      return results[0];
    } else {
      const results = await this.getDb().insert(schema.siteContent).values(data).returning();
      return results[0];
    }
  }
}

export const storage = new DatabaseStorage();
