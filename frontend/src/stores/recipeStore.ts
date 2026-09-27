import { create } from 'zustand';
import { Ingredient, NutritionInfo, RecipeVariation } from '../types';

export interface RecipeStepItem {
  step_number: number;
  instruction: string;
}

interface RecipeState {
  currentRecipe: RecipeVariation | null;
  activeDishId: string | null;
  activeRecipeId: string | null;
  activeRecipeName: string;
  activeNutrition: NutritionInfo;
  activeIngredients: Ingredient[];
  activeSteps: RecipeStepItem[];
  cachedVariations: Record<string, RecipeVariation[]>;

  setActiveDishId: (dishId: string) => void;
  setCachedVariations: (dishId: string, variations: RecipeVariation[]) => void;
  setActiveRecipe: (recipe: RecipeVariation) => void;
  setActiveDetails: (data: {
    id: string;
    dishId?: string;
    name: string;
    description?: string;
    nutrition?: NutritionInfo;
    ingredients?: Ingredient[];
    steps?: RecipeStepItem[];
  }) => void;
  setIngredients: (ingredients: Ingredient[]) => void;
  setSteps: (steps: RecipeStepItem[]) => void;
  clear: () => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  currentRecipe: null,
  activeDishId: null,
  activeRecipeId: null,
  activeRecipeName: 'Recept',
  activeNutrition: { calories: 520, protein: 24, fat: 18, carbs: 55 },
  activeIngredients: [],
  activeSteps: [],
  cachedVariations: {},

  setActiveDishId: (dishId) => set({ activeDishId: dishId }),

  setCachedVariations: (dishId, variations) =>
    set((state) => ({
      cachedVariations: {
        ...state.cachedVariations,
        [dishId]: variations,
      },
    })),

  setActiveRecipe: (recipe) =>
    set((state) => ({
      currentRecipe: recipe,
      activeRecipeId: recipe.id,
      activeRecipeName: recipe.name,
      activeNutrition: recipe.nutrition || { calories: 520, protein: 24, fat: 18, carbs: 55 },
      activeIngredients: recipe.ingredients || [],
      activeSteps: (recipe.instructions || []).map((ins, i) => ({
        step_number: i + 1,
        instruction: ins,
      })),
      activeDishId: (recipe as any).dishId || (recipe as any).dish_id || state.activeDishId,
    })),

  setActiveDetails: (data) =>
    set((state) => ({
      activeRecipeId: data.id,
      activeDishId: data.dishId || state.activeDishId,
      activeRecipeName: data.name || state.activeRecipeName,
      activeNutrition: data.nutrition || state.activeNutrition,
      activeIngredients: data.ingredients || state.activeIngredients,
      activeSteps: data.steps || state.activeSteps,
    })),

  setIngredients: (ingredients) => {
    const clean = (ingredients || []).filter((i) => {
      const n = (i.name || '').toLowerCase();
      return !n.includes('čerstvé suroviny na') && !n.includes('hlavní surovina pro');
    });
    set({ activeIngredients: clean.length > 0 ? clean : ingredients });
  },
  setSteps: (steps) => set({ activeSteps: steps }),
  clear: () =>
    set({
      currentRecipe: null,
      activeDishId: null,
      activeRecipeId: null,
      activeRecipeName: 'Recept',
      activeNutrition: { calories: 520, protein: 24, fat: 18, carbs: 55 },
      activeIngredients: [],
      activeSteps: [],
    }),
}));
