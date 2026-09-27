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

  setActiveDishId: (dishId: string | null) => void;
  setActiveRecipeId: (recipeId: string | null) => void;
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

const STORAGE_ACTIVE_RECIPE_KEY = 'vkusno_active_recipe_id';
const STORAGE_ACTIVE_RECIPE_NAME_KEY = 'vkusno_active_recipe_name';
const STORAGE_ACTIVE_DISH_KEY = 'vkusno_active_dish_id';

const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string | null) => {
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
};

export const useRecipeStore = create<RecipeState>((set) => ({
  currentRecipe: null,
  activeDishId: getStorageItem(STORAGE_ACTIVE_DISH_KEY),
  activeRecipeId: getStorageItem(STORAGE_ACTIVE_RECIPE_KEY),
  activeRecipeName: getStorageItem(STORAGE_ACTIVE_RECIPE_NAME_KEY) || 'Recept',
  activeNutrition: { calories: 520, protein: 24, fat: 18, carbs: 55 },
  activeIngredients: [],
  activeSteps: [],
  cachedVariations: {},

  setActiveDishId: (dishId) => {
    setStorageItem(STORAGE_ACTIVE_DISH_KEY, dishId);
    set({ activeDishId: dishId });
  },

  setActiveRecipeId: (recipeId) => {
    setStorageItem(STORAGE_ACTIVE_RECIPE_KEY, recipeId);
    set({ activeRecipeId: recipeId });
  },

  setCachedVariations: (dishId, variations) =>
    set((state) => ({
      cachedVariations: {
        ...state.cachedVariations,
        [dishId]: variations,
      },
    })),

  setActiveRecipe: (recipe) => {
    setStorageItem(STORAGE_ACTIVE_RECIPE_KEY, recipe.id);
    setStorageItem(STORAGE_ACTIVE_RECIPE_NAME_KEY, recipe.name);
    const dishId = (recipe as any).dishId || (recipe as any).dish_id;
    if (dishId) setStorageItem(STORAGE_ACTIVE_DISH_KEY, dishId);

    return set((state) => ({
      currentRecipe: recipe,
      activeRecipeId: recipe.id,
      activeRecipeName: recipe.name,
      activeNutrition: recipe.nutrition || { calories: 520, protein: 24, fat: 18, carbs: 55 },
      activeIngredients: recipe.ingredients || [],
      activeSteps: (recipe.instructions || []).map((ins, i) => ({
        step_number: i + 1,
        instruction: ins,
      })),
      activeDishId: dishId || state.activeDishId,
    }));
  },

  setActiveDetails: (data) => {
    setStorageItem(STORAGE_ACTIVE_RECIPE_KEY, data.id);
    if (data.name) setStorageItem(STORAGE_ACTIVE_RECIPE_NAME_KEY, data.name);
    if (data.dishId) setStorageItem(STORAGE_ACTIVE_DISH_KEY, data.dishId);

    return set((state) => ({
      activeRecipeId: data.id,
      activeDishId: data.dishId || state.activeDishId,
      activeRecipeName: data.name || state.activeRecipeName,
      activeNutrition: data.nutrition || state.activeNutrition,
      activeIngredients: data.ingredients || state.activeIngredients,
      activeSteps: data.steps || state.activeSteps,
    }));
  },

  setIngredients: (ingredients) => {
    const clean = (ingredients || []).filter((i) => {
      const n = (i.name || '').toLowerCase();
      return !n.includes('čerstvé suroviny na') && !n.includes('hlavní surovina pro');
    });
    set({ activeIngredients: clean.length > 0 ? clean : ingredients });
  },
  setSteps: (steps) => set({ activeSteps: steps }),
  clear: () => {
    setStorageItem(STORAGE_ACTIVE_RECIPE_KEY, null);
    setStorageItem(STORAGE_ACTIVE_RECIPE_NAME_KEY, null);
    setStorageItem(STORAGE_ACTIVE_DISH_KEY, null);
    set({
      currentRecipe: null,
      activeDishId: null,
      activeRecipeId: null,
      activeRecipeName: 'Recept',
      activeNutrition: { calories: 520, protein: 24, fat: 18, carbs: 55 },
      activeIngredients: [],
      activeSteps: [],
    });
  },
}));
