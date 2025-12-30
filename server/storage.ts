import { eq, desc } from "drizzle-orm";
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
  InsertOrderItem
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
  getAllOrders(): Promise<(Order & { items: OrderItem[] })[]>;
  getOrderById(id: number): Promise<(Order & { items: OrderItem[] }) | undefined>;
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderTracking(id: number, trackingNumber: string): Promise<Order | undefined>;
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
  async getAllOrders(): Promise<(Order & { items: OrderItem[] })[]> {
    const orders = await this.db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    
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
      .set({ trackingNumber })
      .where(eq(schema.orders.id, id))
      .returning();
    return results[0];
  }
}

export const storage = new DatabaseStorage();
