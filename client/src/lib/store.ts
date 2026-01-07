import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@shared/schema';

export interface CartItem extends Product {
  quantity: number;
  variantId?: number;
}

const MAX_COMPARE_ITEMS = 4;

interface CompareStore {
  productIds: number[];
  addToCompare: (productId: number) => boolean;
  removeFromCompare: (productId: number) => void;
  clearCompare: () => void;
  isInCompare: (productId: number) => boolean;
  canAddMore: () => boolean;
}

export const useCompare = create<CompareStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      addToCompare: (productId) => {
        const ids = get().productIds;
        if (ids.length >= MAX_COMPARE_ITEMS) return false;
        if (ids.includes(productId)) return false;
        set({ productIds: [...ids, productId] });
        return true;
      },
      removeFromCompare: (productId) => {
        set({ productIds: get().productIds.filter(id => id !== productId) });
      },
      clearCompare: () => set({ productIds: [] }),
      isInCompare: (productId) => get().productIds.includes(productId),
      canAddMore: () => get().productIds.length < MAX_COMPARE_ITEMS,
    }),
    {
      name: 'cobblers-compare',
    }
  )
);

const MA_TAX_RATE = 0.0625; // Massachusetts state tax 6.25%
const SHIPPING_RATE = 8.99; // Standard shipping rate
const FREE_SHIPPING_THRESHOLD = 100; // Free shipping for orders $100+

type DeliveryMethod = "shipping" | "pickup";

interface CartStore {
  items: CartItem[];
  lastOrderId: number | null;
  deliveryMethod: DeliveryMethod;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  setLastOrderId: (orderId: number) => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  subtotal: () => number;
  shipping: () => number;
  tax: () => number;
  total: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      lastOrderId: null,
      deliveryMethod: "shipping" as DeliveryMethod,
      addToCart: (product) => {
        const items = get().items;
        const productWithVariant = product as CartItem;
        const existingItem = items.find((item) => 
          item.id === product.id && 
          item.variantId === productWithVariant.variantId
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id && item.variantId === productWithVariant.variantId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...productWithVariant, quantity: 1 }] });
        }
      },
      removeFromCart: (productId, variantId?) => {
        set({ 
          items: get().items.filter((item) => 
            !(item.id === productId && item.variantId === variantId)
          ) 
        });
      },
      updateQuantity: (productId, quantity, variantId?) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, variantId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === productId && item.variantId === variantId 
              ? { ...item, quantity } 
              : item
          ),
        });
      },
      clearCart: () => set({ items: [], deliveryMethod: "shipping" }),
      setLastOrderId: (orderId) => set({ lastOrderId: orderId }),
      setDeliveryMethod: (method) => set({ deliveryMethod: method }),
      subtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
          0
        );
      },
      shipping: () => {
        if (get().deliveryMethod === "pickup") return 0;
        const subtotal = get().subtotal();
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
      },
      tax: () => {
        return get().subtotal() * MA_TAX_RATE;
      },
      total: () => {
        return get().subtotal() + get().shipping() + get().tax();
      },
    }),
    {
      name: 'cobblers-cart',
    }
  )
);
