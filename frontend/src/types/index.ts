export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface AllergenInfo {
  code: number;
  name: string;
  shortName: string;
}

export const CZECH_ALLERGENS: AllergenInfo[] = [
  { code: 1, name: 'Obiloviny obsahující lepek', shortName: 'Lepek' },
  { code: 2, name: 'Korýši a výrobky z nich', shortName: 'Korýši' },
  { code: 3, name: 'Vejce a výrobky z nich', shortName: 'Vejce' },
  { code: 4, name: 'Ryby a výrobky z nich', shortName: 'Ryby' },
  { code: 5, name: 'Podzemnice olejná (arašídy)', shortName: 'Arašídy' },
  { code: 6, name: 'Sójové boby (sója)', shortName: 'Sója' },
  { code: 7, name: 'Mléko a výrobky z něj (laktóza)', shortName: 'Laktóza' },
  { code: 8, name: 'Skořápkové plody (ořechy)', shortName: 'Ořechy' },
  { code: 9, name: 'Celer a výrobky z něj', shortName: 'Celer' },
  { code: 10, name: 'Hořčice a výrobky z ní', shortName: 'Hořčice' },
  { code: 11, name: 'Sezamová semena', shortName: 'Sezam' },
  { code: 12, name: 'Oxid siřičitý a siřičitany', shortName: 'Siřičitany' },
  { code: 13, name: 'Vlčí bob (lupina)', shortName: 'Lupina' },
  { code: 14, name: 'Měkkýši a výrobky z nich', shortName: 'Měkkýši' },
];

export interface RecipeVariation {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  nutrition: NutritionInfo;
  allergens?: number[]; // Official Czech allergen numbers (1-14)
  dietaryTags?: string[]; // 'vegan' | 'vegetarian' | 'bez-lepku' | 'bez-laktozy'
  image?: string;
  rating?: number;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  variations: RecipeVariation[];
}

export interface Store {
  id: string;
  name: string;
  address: string;
  distance: number; // Straight distance in meters
  routeDistance?: number; // Street network walking distance in meters
  walkingMinutes?: number; // Estimated walking time
  lat: number;
  lng: number;
  logo?: string;
}

export interface Product {
  id: string;
  ingredientId: string;
  storeId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl?: string;
  discountValidUntil?: string;
  isRealDeal?: boolean;
}

export interface ShoppingStrategy {
  type: 'cheapest' | 'closest' | 'optimal';
  totalPrice: number;
  stores: Store[];
  items: { product: Product; ingredient: Ingredient }[];
}

export interface CookedDishRecord {
  id: string;
  variationId: string;
  name: string;
  cookedAt: string; // ISO string
  prepTimeMinutes: number;
  rating: number; // 1-5
  comment?: string;
  savedMoney: number;
  allergens?: number[];
  dietaryTags?: string[];
}
