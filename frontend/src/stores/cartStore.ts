import { create } from 'zustand';

interface CartState {
  selectedStrategy: 'cheapest' | 'closest' | 'optimal';
  setStrategy: (strategy: 'cheapest' | 'closest' | 'optimal') => void;
  purchasedProductIds: string[];
  toggleProductPurchase: (id: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  selectedStrategy: 'optimal',
  setStrategy: (strategy) => set({ selectedStrategy: strategy }),
  purchasedProductIds: [],
  toggleProductPurchase: (id) =>
    set((state) => ({
      purchasedProductIds: state.purchasedProductIds.includes(id)
        ? state.purchasedProductIds.filter((p) => p !== id)
        : [...state.purchasedProductIds, id],
    })),
  clear: () => set({ purchasedProductIds: [] }),
}));
