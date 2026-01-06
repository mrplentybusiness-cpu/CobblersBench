import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@shared/schema';

export interface CartItem extends Product {
  quantity: number;
}

const MA_TAX_RATE = 0.0625; // Massachusetts state tax 6.25%

interface CartStore {
  items: CartItem[];
  lastOrderId: number | null;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setLastOrderId: (orderId: number) => void;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      lastOrderId: null,
      addToCart: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },
      removeFromCart: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      setLastOrderId: (orderId) => set({ lastOrderId: orderId }),
      subtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
          0
        );
      },
      tax: () => {
        return get().subtotal() * MA_TAX_RATE;
      },
      total: () => {
        return get().subtotal() + get().tax();
      },
    }),
    {
      name: 'cobblers-cart',
    }
  )
);
