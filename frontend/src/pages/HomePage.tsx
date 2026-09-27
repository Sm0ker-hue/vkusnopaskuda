import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DishSearch } from '../components/dishes/DishSearch';
import { DietaryFilters } from '../components/dishes/DietaryFilters';
import { apiClient } from '../api/client';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCartStore } from '../stores/cartStore';
import { usePreferencesStore } from '../stores/preferencesStore';

import { useRecipeStore } from '../stores/recipeStore';
import { Utensils } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { clear: clearInventory } = useInventoryStore();
  const { clear: clearCart } = useCartStore();
  const { activeRecipeId, activeRecipeName } = useRecipeStore();


  const handleSearch = async (query: string) => {
    // Clear inventory, cart, and recipe store when starting a new dish search
    clearInventory();
    clearCart();
    useRecipeStore.getState().clear();

    const { isVegan, isVegetarian, isKeto, isGlutenFree, isLactoseFree, excludedAllergens } =
      usePreferencesStore.getState();

    const preferences = {
      is_vegan: isVegan,
      is_vegetarian: isVegetarian,
      is_keto: isKeto,
      is_gluten_free: isGlutenFree,
      is_lactose_free: isLactoseFree,
      excluded_allergens: excludedAllergens,
    };

    try {
      setLoading(true);
      const res = await apiClient<{ dish_id: string; name: string }>('/dishes/search', {
        method: 'POST',
        body: JSON.stringify({ query, preferences }),
      });
      if (res?.dish_id) {
        navigate(`/variations/${res.dish_id}`);
      } else {
        navigate(`/variations/mock-dish-id`);
      }
    } catch (e) {
      console.error('API call failed, using mock data:', e);
      navigate(`/variations/mock-dish-id`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] space-y-6 pb-12">
      <div className="text-center space-y-3 max-w-md">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Co dnes <span className="text-amber-500">uvaříme</span>?
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Zadejte název jídla a my vám připravíme varianty receptů s ohledem na vaši dietu, zkontrolujeme spíž a najdeme nejlepší slevy v okolí.
        </p>
      </div>
      
      <div className="w-full max-w-md space-y-4">
        {activeRecipeId && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-zinc-300">
              <Utensils className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div>
                <span className="text-amber-400 font-semibold block">Rozpracovaný recept:</span>
                <span className="text-white font-medium truncate max-w-[200px] block">{activeRecipeName}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  clearInventory();
                  clearCart();
                  useRecipeStore.getState().clear();
                }}
                className="px-2 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors text-xs cursor-pointer"
                title="Zrušit rozpracovaný recept"
              >
                Zrušit
              </button>
              <button
                onClick={() => navigate(`/ingredients/${activeRecipeId}`)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer text-xs flex-shrink-0"
              >
                Pokračovat →
              </button>
            </div>
          </div>
        )}
        <DishSearch onSearch={handleSearch} isLoading={loading} />
        {/* Dietary preferences and Czech allergens 1-14 */}
        <DietaryFilters />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 pt-2">
        <span>Oblíbené recepty:</span>
        {['Svíčková', 'Kulajda', 'Guláš', 'Bramboračka', 'Kuře na paprice'].map((dish) => (
          <button
            key={dish}
            onClick={() => handleSearch(dish)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors disabled:opacity-50"
          >
            {dish}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
