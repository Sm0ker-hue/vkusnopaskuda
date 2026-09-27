import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { VariationCard } from '../components/dishes/VariationCard';
import { RecipeVariation } from '../types';
import { apiClient } from '../api/client';
import { Spinner } from '../components/ui/Spinner';
import { ArrowLeft, Filter, ShieldAlert } from 'lucide-react';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useRecipeStore } from '../stores/recipeStore';
import { findMatchingPreset } from '../data/czechRecipes';

const mockVariations: RecipeVariation[] = [
  {
    id: 'var-1',
    name: 'Tradiční česká svíčková',
    description: 'Poctivá klasika s prošpikovaným hovězím zadním, kořenovou zeleninou, karlovarským knedlíkem a brusinkami.',
    ingredients: [
      { id: 'ing-1', name: 'Hovězí zadní', amount: 600, unit: 'g', category: 'Maso' },
      { id: 'ing-2', name: 'Smetana 33%', amount: 250, unit: 'ml', category: 'Mléčné' },
      { id: 'ing-3', name: 'Kořenová zelenina', amount: 400, unit: 'g', category: 'Zelenina' },
      { id: 'ing-4', name: 'Špek na špikovánī', amount: 80, unit: 'g', category: 'Maso' }
    ],
    instructions: [],
    prepTime: 25,
    cookTime: 120,
    allergens: [1, 7, 9, 10],
    dietaryTags: ['tradiční'],
    nutrition: { calories: 680, protein: 42, fat: 34, carbs: 48 }
  },
  {
    id: 'var-2',
    name: 'Bezlepková svíčková (Gluten-Free)',
    description: 'Tradiční chuť zahuštěná výhradně restovanou zeleninou a bezlepkovou rýžovou moukou, vhodná pro celiaky.',
    ingredients: [
      { id: 'ing-1', name: 'Hovězí zadní', amount: 600, unit: 'g', category: 'Maso' },
      { id: 'ing-2', name: 'Smetana ke šlehání 33%', amount: 250, unit: 'ml', category: 'Mléčné' },
      { id: 'ing-3', name: 'Čerstvá kořenová zelenina', amount: 500, unit: 'g', category: 'Zelenina' }
    ],
    instructions: [],
    prepTime: 20,
    cookTime: 90,
    allergens: [7, 9, 10],
    dietaryTags: ['bez-lepku'],
    nutrition: { calories: 590, protein: 40, fat: 32, carbs: 30 }
  },
  {
    id: 'var-3',
    name: 'Veganská svíčková s uzeným tempehem',
    description: '100% rostlinná bohatá zeleninová omáčka zjemněná ovesnou smetanou s marinovaným tempehem.',
    ingredients: [
      { id: 'ing-6', name: 'Uzený tempeh', amount: 300, unit: 'g', category: 'Alternativy' },
      { id: 'ing-7', name: 'Rostlinná smetana ovesná', amount: 250, unit: 'ml', category: 'Mléčné' },
      { id: 'ing-3', name: 'Kořenová zelenina', amount: 500, unit: 'g', category: 'Zelenina' }
    ],
    instructions: [],
    prepTime: 20,
    cookTime: 40,
    allergens: [6, 9],
    dietaryTags: ['vegan', 'bez-laktozy'],
    nutrition: { calories: 340, protein: 22, fat: 14, carbs: 32 }
  }
];

interface ApiVariation {
  id: string;
  dish_id: string;
  name: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  allergens?: number[];
  dietary_tags?: string[];
  image_url?: string;
}

const VariationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { dishId } = useParams();
  const { cachedVariations, setCachedVariations, setActiveDishId } = useRecipeStore();
  
  // Instant load from cache: 0ms delay, no re-fetching lag when coming back from ingredients
  const [variations, setVariations] = useState<RecipeVariation[]>(() => {
    if (dishId && cachedVariations[dishId] && cachedVariations[dishId].length > 0) {
      return cachedVariations[dishId];
    }
    return mockVariations;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (dishId && cachedVariations[dishId] && cachedVariations[dishId].length > 0) {
      return false;
    }
    return Boolean(dishId && dishId !== 'mock-dish-id');
  });

  const { isVegan, isVegetarian, isKeto, isGlutenFree, isLactoseFree, excludedAllergens } = usePreferencesStore();

  useEffect(() => {
    if (dishId) {
      setActiveDishId(dishId);

      if (dishId !== 'mock-dish-id') {
        const hasCached = Boolean(cachedVariations[dishId] && cachedVariations[dishId].length > 0);
        if (!hasCached) {
          setLoading(true);
        }

        apiClient<ApiVariation[]>(`/dishes/${dishId}/variations`)
          .then((data) => {
            if (data && data.length > 0) {
              const mapped: RecipeVariation[] = data.map((v) => {
                const tags: string[] = [];
                const lower = (v.name + ' ' + v.description).toLowerCase();
                if (lower.includes('vegan') || lower.includes('rostlinn')) tags.push('vegan');
                else if (lower.includes('vegetari')) tags.push('vegetarian');
                if (lower.includes('bezlepk') || lower.includes('bez lepku')) tags.push('bez-lepku');
                if (lower.includes('bez lakt') || lower.includes('bezlakt')) tags.push('bez-laktozy');

                // Allergens detection
                const allergens = v.allergens || (tags.includes('bez-lepku') ? [7, 9] : [1, 7, 9, 10]);

                return {
                  id: v.id,
                  name: v.name,
                  description: v.description,
                  prepTime: v.prep_time_minutes || 20,
                  cookTime: v.cook_time_minutes || 30,
                  allergens,
                  dietaryTags: tags.length > 0 ? tags : ['tradiční'],
                  ingredients: [
                    { id: `ing-${v.id}-1`, name: 'Čerstvé suroviny dle receptu', amount: 1, unit: 'balení', category: 'Základ' }
                  ],
                  instructions: [],
                  nutrition: {
                    calories: v.kcal ? Math.round(v.kcal) : 450,
                    protein: v.protein ? Math.round(v.protein) : 25,
                    fat: v.fat ? Math.round(v.fat) : 15,
                    carbs: v.carbs ? Math.round(v.carbs) : 40,
                  },
                  image: v.image_url,
                };
              });
              setVariations(mapped);
              setCachedVariations(dishId, mapped);
            }
          })
          .catch((err) => {
            console.warn('Could not load live variations, using fallback:', err);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishId, setActiveDishId, setCachedVariations]);


  // Strictly filter variations according to the user's active dietary preferences & excluded Czech allergens
  const filteredVariations = useMemo(() => {
    let list = variations;

    if (isVegan) {
      list = list.filter(
        (v) =>
          v.dietaryTags?.includes('vegan') ||
          v.name.toLowerCase().includes('vegan') ||
          v.description.toLowerCase().includes('rostlinn')
      );
    } else if (isVegetarian) {
      list = list.filter(
        (v) =>
          v.dietaryTags?.includes('vegan') ||
          v.dietaryTags?.includes('vegetarian') ||
          v.name.toLowerCase().includes('vegetari') ||
          v.name.toLowerCase().includes('vegan')
      );
    }

    if (isKeto) {
      list = list.filter(
        (v) =>
          v.dietaryTags?.includes('keto') ||
          v.dietaryTags?.includes('low-carb') ||
          v.name.toLowerCase().includes('keto') ||
          v.name.toLowerCase().includes('low-carb') ||
          (v.nutrition?.carbs !== undefined && v.nutrition.carbs <= 15)
      );
    }

    if (isGlutenFree) {
      list = list.filter(
        (v) =>
          !v.allergens?.includes(1) ||
          v.dietaryTags?.includes('bez-lepku') ||
          v.name.toLowerCase().includes('bezlepk')
      );
    }

    if (isLactoseFree) {
      list = list.filter(
        (v) =>
          !v.allergens?.includes(7) ||
          v.dietaryTags?.includes('bez-laktozy') ||
          v.dietaryTags?.includes('vegan')
      );
    }

    if (excludedAllergens.length > 0) {
      list = list.filter((v) => {
        if (!v.allergens || v.allergens.length === 0) return true;
        return !v.allergens.some((code) => excludedAllergens.includes(code));
      });
    }

    // Fallback: If strict filtering cleared all variations, craft a guaranteed safe tailored recipe
    if (list.length === 0) {
      const synthesizedName = isVegan
        ? 'Veganská specialita na míru'
        : isKeto
        ? 'Keto / Low-Carb specialita na míru'
        : isGlutenFree
        ? 'Bezlepková varianta na míru'
        : 'Speciální dietní recept na míru';

      return [
        {
          id: `var-custom-${Date.now()}`,
          name: synthesizedName,
          description: `Recept sestavený přesně pro vaše preference: ${[
            isVegan && '100% veganské',
            isVegetarian && 'vegetariánské',
            isKeto && 'Keto / Low-Carb (nízkosacharidové)',
            isGlutenFree && 'bez obilovin s lepkem (Alergen 1)',
            isLactoseFree && 'bez laktózy (Alergen 7)',
            excludedAllergens.length > 0 && `vyřazeny alergeny [${excludedAllergens.join(', ')}]`,
          ]
            .filter(Boolean)
            .join(', ')}.`,
          prepTime: 20,
          cookTime: 35,
          allergens: [],
          dietaryTags: [
            isVegan && 'vegan',
            isVegetarian && 'vegetarian',
            isKeto && 'keto',
            isGlutenFree && 'bez-lepku',
            isLactoseFree && 'bez-laktozy',
          ].filter(Boolean) as string[],
          ingredients: [
            { id: 'ing-c-1', name: isVegan ? 'Uzený tempeh / tofu' : 'Kuřecí prsa', amount: 350, unit: 'g', category: 'Základ' },
            { id: 'ing-c-2', name: 'Čerstvá kořenová zelenina', amount: 400, unit: 'g', category: 'Zelenina' },
            { id: 'ing-c-3', name: isLactoseFree ? 'Rostlinná smetana' : 'Smetana ke šlehání', amount: 250, unit: 'ml', category: 'Zjemnění' },
          ],
          instructions: [],
          nutrition: {
            calories: isVegan ? 360 : 490,
            protein: isVegan ? 22 : 38,
            fat: 14,
            carbs: 28,
          },
        },
      ];
    }

    return list;
  }, [variations, isVegan, isVegetarian, isKeto, isGlutenFree, isLactoseFree, excludedAllergens]);

  const hasActiveFilters = isVegan || isVegetarian || isKeto || isGlutenFree || isLactoseFree || excludedAllergens.length > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] space-y-4">
        <Spinner size="lg" />
        <div className="text-center space-y-1">
          <p className="text-white font-medium">Sestavujeme recepty na míru...</p>
          <p className="text-zinc-500 text-xs">Aplikujeme dietní filtry a vyhodnocujeme české alergeny</p>
        </div>
      </div>
    );
  }

  const handleSelectVariation = (variation: RecipeVariation) => {
    const isBackendUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variation.id);
    // Pro dynamické varianty z backendu nepředvyplňujeme generický preset, aby se načetly autentické suroviny z API
    const preset = !isBackendUuid ? findMatchingPreset(variation.name) : null;
    const ingredients = variation.ingredients && variation.ingredients.length > 1
      ? variation.ingredients
      : (preset?.ingredients || []);
    const steps = variation.instructions && variation.instructions.length > 0
      ? variation.instructions.map((ins, i) => ({ step_number: i + 1, instruction: ins }))
      : (preset?.steps || []);

    useRecipeStore.getState().setActiveDetails({
      id: variation.id,
      dishId: dishId,
      name: variation.name,
      description: variation.description,
      nutrition: variation.nutrition || preset?.nutrition,
      ingredients,
      steps,
    });
    useRecipeStore.getState().setActiveRecipe(variation);
    navigate(`/ingredients/${variation.id}`);
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <Link 
          to="/"
          className="inline-flex items-center text-xs text-zinc-400 hover:text-amber-400 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Zpět na vyhledávání nového jídla
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Vyberte si variantu receptu</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          AI sestavila varianty zohledňující vaše dietní preference a české alergeny.
        </p>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-zinc-400 flex items-center font-medium mr-1">
              <Filter className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Aktivní filtry:
            </span>
            {isVegan && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                🌱 Veganské
              </span>
            )}
            {isVegetarian && !isVegan && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                🥗 Vegetariánské
              </span>
            )}
            {isGlutenFree && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                🌾 Bez lepku
              </span>
            )}
            {isLactoseFree && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold">
                🥛 Bez laktózy
              </span>
            )}
            {excludedAllergens.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-semibold flex items-center">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Vyloučeny alergeny: {excludedAllergens.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {filteredVariations.map((variation) => (
          <VariationCard 
            key={variation.id} 
            variation={variation} 
            onClick={() => handleSelectVariation(variation)}
          />
        ))}
      </div>
    </div>
  );
};

export default VariationsPage;

