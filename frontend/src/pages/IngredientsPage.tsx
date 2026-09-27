import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IngredientChecklist } from '../components/ingredients/IngredientChecklist';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { useInventoryStore } from '../stores/inventoryStore';
import { useRecipeStore } from '../stores/recipeStore';
import { findMatchingPreset } from '../data/czechRecipes';
import { ArrowLeft, CheckSquare, Square, ShoppingBag, Utensils } from 'lucide-react';
import { apiClient } from '../api/client';
import { Ingredient } from '../types';

const IngredientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { variationId } = useParams();
  const { availableIngredientIds, initForVariation, setIngredients: setInventoryIngredients, clear: clearInventory } = useInventoryStore();
  const { 
    activeDishId,
    activeRecipeId,
    activeRecipeName, 
    activeIngredients, 
    setActiveDetails, 
    setIngredients: setStoreIngredients 
  } = useRecipeStore();

  // Inicializace ingrediencí:
  // Pouze pokud v recipeStore již máme data pro TUTO KONKRÉTNÍ variantu, použijeme je.
  // Zabrání zobrazení surovin z předchozího receptu při navigaci.
  const [ingredients, setIngredientList] = useState<Ingredient[]>(() => {
    if (activeIngredients && activeIngredients.length > 0 && activeRecipeId === variationId) {
      return activeIngredients;
    }
    const preset = findMatchingPreset(activeRecipeName);
    if (preset) {
      return preset.ingredients;
    }
    return [];
  });

  const [recipeTitle, setRecipeTitle] = useState<string>(activeRecipeName || 'Vybraný recept');
  const [loading, setLoading] = useState<boolean>(ingredients.length === 0);

  useEffect(() => {
    if (variationId) {
      initForVariation(variationId);

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variationId);

      // Pokud již máme načtené autentické ingredience pro TUTO KONKRÉTNÍ variantu z předchozího volání
      if (activeIngredients && activeIngredients.length >= 3 && activeRecipeId === variationId) {
        setIngredientList(activeIngredients);
        if (activeRecipeName) setRecipeTitle(activeRecipeName);
        setLoading(false);
        return;
      }

      if (isUuid) {
        // Pro databázové varianty vždy načítáme autentické suroviny vygenerované AI
        setLoading(true);
        apiClient<any>(`/recipes/${variationId}/details`)
          .then((data) => {
            if (data?.ingredients && data.ingredients.length > 0) {
              const rawIngredients = data.ingredients || [];
              const validIngredients = rawIngredients.filter((ing: any) => {
                const n = (ing.name || '').toLowerCase();
                return !n.includes('čerstvé suroviny na') && !n.includes('hlavní surovina pro');
              });

              let mapped: Ingredient[] = [];
              if (validIngredients.length >= 3) {
                mapped = validIngredients.map((ing: any, i: number) => ({
                  id: ing.id || `ing-${i + 1}`,
                  name: ing.name || `Surovina ${i + 1}`,
                  amount: typeof ing.amount === 'number' ? ing.amount : 100,
                  unit: ing.unit || 'g',
                  category: ing.category || 'Suroviny',
                }));
              } else {
                const preset = findMatchingPreset(data.name || activeRecipeName);
                if (preset) {
                  mapped = preset.ingredients;
                }
              }

              if (mapped.length > 0) {
                setIngredientList(mapped);
                setStoreIngredients(mapped);

                if (data.name) {
                  setRecipeTitle(data.name);
                }

                setActiveDetails({
                  id: variationId,
                  dishId: activeDishId || undefined,
                  name: data.name || recipeTitle,
                  description: data.description,
                  nutrition: data.nutrition,
                  ingredients: mapped,
                  steps: data.steps,
                });
              }
            }
          })
          .catch((err) => {
            console.warn('Could not load dynamic recipe details from backend, falling back to preset:', err);
            const preset = findMatchingPreset(activeRecipeName);
            if (preset) {
              setIngredientList(preset.ingredients);
              setRecipeTitle(preset.name);
              setStoreIngredients(preset.ingredients);
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        // Pouze pro statické mock varianty
        const preset = findMatchingPreset(activeRecipeName);
        if (preset) {
          setIngredientList(preset.ingredients);
          setRecipeTitle(preset.name);
          setStoreIngredients(preset.ingredients);
        }
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variationId, initForVariation, activeRecipeName, activeRecipeId, activeDishId]);

  const handleSelectAll = () => {
    setInventoryIngredients(ingredients.map((i) => i.id));
  };

  const handleClearAll = () => {
    clearInventory();
  };

  const ownedCount = availableIngredientIds.length;
  const toBuyCount = Math.max(0, ingredients.length - ownedCount);

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
      {/* Navigation Breadcrumb - Instant 0ms back navigation */}
      <div>
        <button 
          onClick={() => {
            if (activeDishId) {
              navigate(`/variations/${activeDishId}`);
            } else {
              navigate(-1);
            }
          }}
          className="inline-flex items-center text-xs text-zinc-400 hover:text-amber-400 mb-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Zpět na výběr varianty
        </button>

        {/* Selected dish banner */}
        <div className="flex items-center space-x-2 mb-1.5">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
            <Utensils className="w-3 h-3 mr-1" />
            {recipeTitle}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Co už máte ve spíži?</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Zaškrtněte položky, které máte doma. Do nákupního košíku zařadíme <strong className="text-amber-400">pouze to, co vám chybí</strong>.
        </p>
      </div>

      {/* Quick Action Toolbar */}
      <div className="flex items-center justify-between bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800 text-xs">
        <span className="text-zinc-400">
          Máte doma: <strong className="text-emerald-400">{ownedCount}</strong> | K nákupu:{' '}
          <strong className="text-amber-400">{toBuyCount}</strong>
        </span>
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-1 text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mám vše</span>
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1 text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-zinc-400" />
            <span>Koupit vše</span>
          </button>
        </div>
      </div>

      {loading && ingredients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-800">
          <Spinner size="lg" />
          <span className="text-zinc-400 text-xs">Načítám čerstvé suroviny z českých obchodů...</span>
        </div>
      ) : (
        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80">
          <IngredientChecklist ingredients={ingredients} />
        </div>
      )}

      <div className="sticky bottom-20 bg-zinc-950/90 backdrop-blur-md pt-3 pb-1 border-t border-zinc-800/80">
        <Button 
          className="w-full text-base py-3 flex items-center justify-center space-x-2" 
          onClick={() => {
            // Guarantee store has these exact ingredients before shopping
            setStoreIngredients(ingredients);
            navigate(`/shopping/${variationId}`);
          }}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>
            {toBuyCount === 0 ? 'Vše máte doma — rovnou k receptu' : `Sestavit košík (${toBuyCount} ${toBuyCount === 1 ? 'položka' : toBuyCount < 5 ? 'položky' : 'položek'})`}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default IngredientsPage;
