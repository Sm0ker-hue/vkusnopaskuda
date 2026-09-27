import { create } from 'zustand';

interface InventoryState {
  currentVariationId: string | null;
  availableIngredientIds: string[];
  initForVariation: (variationId: string) => void;
  toggleIngredient: (id: string) => void;
  setIngredients: (ids: string[]) => void;
  clear: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  currentVariationId: null,
  availableIngredientIds: [],

  initForVariation: (variationId: string) =>
    set((state) => {
      // If switching to a different dish/variation, reset pantry selections
      if (state.currentVariationId !== variationId) {
        return {
          currentVariationId: variationId,
          availableIngredientIds: [],
        };
      }
      return state;
    }),

  toggleIngredient: (id) =>
    set((state) => ({
      availableIngredientIds: state.availableIngredientIds.includes(id)
        ? state.availableIngredientIds.filter((i) => i !== id)
        : [...state.availableIngredientIds, id],
    })),

  setIngredients: (ids) => set({ availableIngredientIds: ids }),
  clear: () => set({ availableIngredientIds: [], currentVariationId: null }),
}));
