  // store/useCartStore.ts
  import { create } from "zustand";

  export interface CartItem {
    id: number;
    name: string;
    category_name: string | null;
    subcategory_name: string | null;
    price: number;
    qty: number;
  }

  interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "qty">, qty: number) => void;
    removeOne: (id: number) => void;
    removeAll: (id: number) => void;
    clear: () => void;
  }

  export const useCartStore = create<CartStore>((set) => ({
    items: [],

    addItem: (item, qty) => {
      set((state) => {
        const existing = state.items.find(
          (i) => i.id === item.id && i.price === item.price,
        );
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.id === item.id && i.price === item.price
                ? { ...i, qty: i.qty + qty }
                : i,
            ),
          };
        }
        return { items: [...state.items, { ...item, qty }] };
      });
    },

    removeOne: (id) => {
      set((state) => ({
        items: state.items
          .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
          .filter((i) => i.qty > 0),
      }));
    },

    removeAll: (id) => {
      set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    },

    clear: () => set({ items: [] }),
  }));
