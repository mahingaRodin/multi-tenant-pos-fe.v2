import { create } from "zustand";
import type { ProductDto } from "@/lib/types";

export interface CartItem {
  product: ProductDto;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  setCustomer: (id: string | null) => void;
  addItem: (product: ProductDto) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  setCustomer: (id) => set({ customerId: id }),
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    }),
  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),
  updateQty: (productId, qty) =>
    set((state) => ({
      items:
        qty <= 0
          ? state.items.filter((i) => i.product.id !== productId)
          : state.items.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)),
    })),
  clearCart: () => set({ items: [], customerId: null }),
  subtotal: () =>
    get().items.reduce((sum, i) => sum + (i.product.sellingPrice ?? 0) * i.quantity, 0),
  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
