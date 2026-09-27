import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { StrategyTabs } from '../components/shopping/StrategyTabs';
import { ShoppingCart } from '../components/shopping/ShoppingCart';
import { Button } from '../components/ui/Button';
import { ShoppingStrategy } from '../types';
import { useInventoryStore } from '../stores/inventoryStore';
import { useGeolocation, CZECH_CITIES } from '../hooks/useGeolocation';
import { ArrowLeft, MapPin, RefreshCw, CheckCircle2, ChevronDown } from 'lucide-react';
import { apiClient } from '../api/client';

export interface StoreBranchAddress {
  storeId: string;
  storeName: string;
  offsetLat: number;
  offsetLng: number;
  items: Array<{
    id: string;
    ingredientId: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    ingredientName: string;
  }>;
}

import { findNearestStoreBranch } from '../data/czechStores';
import { useRecipeStore } from '../stores/recipeStore';
import { generateSupermarketCatalog } from '../data/supermarketCatalog';
import { findMatchingPreset, CZECH_RECIPE_PRESETS } from '../data/czechRecipes';
import { Utensils } from 'lucide-react';




function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

const ShoppingPage: React.FC = () => {
  const navigate = useNavigate();
  const { variationId } = useParams();
  const [strategyType, setStrategyType] = useState<'cheapest' | 'closest' | 'optimal'>('optimal');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const { availableIngredientIds } = useInventoryStore();
  const {
    lat,
    lng,
    city,
    status: geoStatus,
    error: geoError,
    requestLocation,
    setCityManually,
  } = useGeolocation();

  const { activeRecipeName, activeIngredients } = useRecipeStore();

  const currentIngredients = useMemo(() => {
    if (activeIngredients && activeIngredients.length > 0) {
      return activeIngredients;
    }
    const preset = findMatchingPreset(activeRecipeName);
    if (preset) {
      return preset.ingredients;
    }
    return CZECH_RECIPE_PRESETS.bramboracka.ingredients;
  }, [activeIngredients, activeRecipeName]);

  const dynamicCatalog = useMemo(() => {
    return generateSupermarketCatalog(currentIngredients);
  }, [currentIngredients]);

  // Dynamic store positioning strictly relative to user's real location
  const computedStrategy = useMemo(() => {
    const storeCalculations = dynamicCatalog.map((store) => {
      // Exclude items already at home in user's inventory
      const itemsToBuy = store.items
        .filter((item) => !availableIngredientIds.includes(item.ingredientId))
        .map((p) => ({
          product: {
            id: p.id,
            ingredientId: p.ingredientId,
            storeId: store.storeId,
            name: p.name,
            price: p.price,
            quantity: p.quantity,
            unit: p.unit,
          },
          ingredient: {
            id: p.ingredientId,
            name: p.ingredientName,
            amount: p.quantity,
            unit: p.unit,
            category: 'Recept',
          },
        }));

      const ownedItems = store.items
        .filter((item) => availableIngredientIds.includes(item.ingredientId));

      const totalPrice = itemsToBuy.reduce((sum, item) => sum + item.product.price, 0);
      const savedMoney = ownedItems.reduce((sum, item) => sum + item.price, 0);
      const branch = findNearestStoreBranch(store.storeId, lat, lng, city);
      const distance = calculateDistance(lat, lng, branch.lat, branch.lng);
      const routeDistance = Math.round(distance * 1.3);
      const walkingMinutes = Math.max(1, Math.round(routeDistance / 75));

      return {
        storeId: store.storeId,
        storeName: branch.branchName || store.storeName,
        address: branch.address,
        distance,
        routeDistance,
        walkingMinutes,
        lat: branch.lat,
        lng: branch.lng,
        itemsToBuy,
        ownedItems,
        totalPrice,
        savedMoney,
      };
    });


    let selected = storeCalculations[0];
    if (strategyType === 'cheapest') {
      selected = [...storeCalculations].sort((a, b) => a.totalPrice - b.totalPrice)[0];
    } else if (strategyType === 'closest') {
      selected = [...storeCalculations].sort((a, b) => a.routeDistance - b.routeDistance)[0];
    } else {
      const maxPrice = Math.max(...storeCalculations.map((s) => s.totalPrice)) || 1;
      const maxDist = Math.max(...storeCalculations.map((s) => s.routeDistance)) || 1;
      selected = [...storeCalculations].sort((a, b) => {
        const scoreA = 0.6 * (a.totalPrice / maxPrice) + 0.4 * (a.routeDistance / maxDist);
        const scoreB = 0.6 * (b.totalPrice / maxPrice) + 0.4 * (b.routeDistance / maxDist);
        return scoreA - scoreB;
      })[0];
    }

    const finalStrategy: ShoppingStrategy = {
      type: strategyType,
      totalPrice: selected.totalPrice,
      stores: [
        {
          id: selected.storeId,
          name: selected.storeName,
          address: selected.address,
          distance: selected.distance,
          routeDistance: selected.routeDistance,
          walkingMinutes: selected.walkingMinutes,
          lat: selected.lat,
          lng: selected.lng,
        },
      ],
      items: selected.itemsToBuy,
    };

    return {
      strategy: finalStrategy,
      ownedItems: selected.ownedItems,
      savedMoney: selected.savedMoney,
    };
  }, [lat, lng, city, availableIngredientIds, strategyType, dynamicCatalog]);

  const [backendComparison, setBackendComparison] = useState<any>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchComparison = async () => {
      try {
        setIsLoadingBackend(true);
        const res = await apiClient<any>('/shopping/compare', {
          method: 'POST',
          body: JSON.stringify({
            items: currentIngredients.map((i) => ({
              id: i.id,
              name: i.name,
              amount: i.amount,
              unit: i.unit,
              category: i.category,
            })),
            user_lat: lat,
            user_lon: lng,
            city: city,
            excluded_names: currentIngredients
              .filter((i) => availableIngredientIds.includes(i.id))
              .map((i) => i.name),
          }),
        });
        if (!isCancelled && res && res.strategies) {
          setBackendComparison(res);
        }
      } catch (err) {
        console.warn('Real pricing API call failed, using client fallback:', err);
      } finally {
        if (!isCancelled) setIsLoadingBackend(false);
      }
    };

    fetchComparison();
    return () => {
      isCancelled = true;
    };
  }, [currentIngredients, availableIngredientIds, lat, lng, city]);

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const allAvailableStores = useMemo(() => {
    if (backendComparison?.all_stores && backendComparison.all_stores.length > 0) {
      return backendComparison.all_stores;
    }
    return computedStrategy.strategy.stores.map((s) => ({
      storeId: s.id,
      storeName: s.name,
      chainName: s.name.split(' ')[0],
      address: s.address,
      distance: s.distance,
      routeDistance: s.routeDistance || s.distance,
      walkingMinutes: s.walkingMinutes || 5,
      totalPrice: computedStrategy.strategy.totalPrice,
      items: computedStrategy.strategy.items,
    }));
  }, [backendComparison, computedStrategy]);

  const activeStrategy = useMemo(() => {
    if (backendComparison?.strategies) {
      let chosenStore = backendComparison.strategies[strategyType];
      if (selectedStoreId && backendComparison.all_stores) {
        const found = backendComparison.all_stores.find((s: any) => s.storeId === selectedStoreId);
        if (found) {
          chosenStore = {
            type: strategyType,
            totalPrice: found.totalPrice,
            stores: [{
              id: found.storeId,
              name: found.storeName,
              address: found.address,
              distance: found.distance,
              routeDistance: found.routeDistance,
              walkingMinutes: found.walkingMinutes,
              lat: found.lat,
              lng: found.lng,
            }],
            items: found.items,
          };
        }
      }
      return {
        strategy: chosenStore as ShoppingStrategy,
        ownedItems: (backendComparison.owned_items || []).map((it: any) => ({
          id: it.id,
          ingredientName: it.name,
          price: 0,
        })),
        savedMoney: backendComparison.saved_money || 0,
        isRealKupiData: true,
      };
    }
    return {
      ...computedStrategy,
      isRealKupiData: false,
    };
  }, [backendComparison, strategyType, selectedStoreId, computedStrategy]);

  const { strategy, ownedItems, savedMoney, isRealKupiData } = activeStrategy;
  const hasItemsToBuy = strategy.items.length > 0;

  return (
    <div className="flex flex-col h-full pb-24 space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link 
          to={variationId ? `/ingredients/${variationId}` : '/'}
          className="inline-flex items-center text-xs text-zinc-400 hover:text-amber-400 mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Zpět ke kontrole spíže
        </Link>

        {/* Selected dish banner */}
        <div className="flex items-center flex-wrap gap-2 mb-1.5">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
            <Utensils className="w-3 h-3 mr-1" />
            {activeRecipeName || 'Vybraný recept'}
          </span>
          {isRealKupiData && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/30 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
              Reálné ceny a letáky Kupi.cz
            </span>
          )}
          {isLoadingBackend && (
            <span className="text-zinc-400 text-xs flex items-center bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
              <RefreshCw className="w-3 h-3 animate-spin mr-1 text-amber-400" />
              Načítám české akční letáky...
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">Kde nakoupit nejvýhodněji?</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Srovnání nejbližších supermarketů přímo ve vašem okolí pro chybějící suroviny.
        </p>
      </div>


      {/* Geolocation Status Bar & City Switcher */}
      <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div>
              <span className="text-zinc-400">Vaše lokalita: </span>
              <strong className="text-white font-semibold">{city}</strong>
              {geoStatus === 'loading' && <span className="text-amber-400 ml-1">(zaměřuji GPS...)</span>}
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowCityPicker((prev) => !prev)}
              className="flex items-center space-x-1 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 px-2 py-1 rounded transition-colors"
            >
              <span>Změnit město</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={requestLocation}
              className="flex items-center space-x-1 text-zinc-400 hover:text-amber-400 bg-zinc-800/80 hover:bg-zinc-800 px-2 py-1 rounded transition-colors"
              title="Aktualizovat z GPS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${geoStatus === 'loading' ? 'animate-spin' : ''}`} />
              <span>GPS</span>
            </button>
          </div>
        </div>

        {geoError && <p className="text-[11px] text-amber-500/80">{geoError}</p>}

        {/* Quick City Dropdown */}
        {showCityPicker && (
          <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
            <span className="text-zinc-500 text-[10px] w-full block">Vyberte české město:</span>
            {CZECH_CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setCityManually(c.name);
                  setShowCityPicker(false);
                }}
                className={`px-2 py-1 rounded-md text-[11px] border transition-colors ${
                  city.includes(c.name)
                    ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Tabs */}
      <StrategyTabs 
        activeStrategy={strategyType} 
        onChange={(st) => {
          setSelectedStoreId(null);
          setStrategyType(st);
        }} 
      />

      {/* Interactive Supermarket Switcher Carousel/List */}
      {allAvailableStores.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-zinc-300">
              {strategyType === 'closest' ? '📍 Supermarkety seřazené dle vzdálenosti:' : strategyType === 'cheapest' ? '💰 Supermarkety seřazené dle ceny:' : '⚡ Dostupné supermarkety v okolí:'}
            </span>
            <span className="text-[11px] text-zinc-400">{allAvailableStores.length} prodejen</span>
          </div>
          <div className="flex space-x-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {allAvailableStores.map((st: any) => {
              const isSelected = selectedStoreId === st.storeId || (!selectedStoreId && strategy.stores[0]?.id === st.storeId);
              return (
                <button
                  key={st.storeId}
                  onClick={() => setSelectedStoreId(st.storeId)}
                  className={`flex-shrink-0 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between space-x-3 mb-1">
                    <span className="font-bold text-xs text-white">{st.chainName || st.storeName}</span>
                    <span className="text-xs font-bold text-amber-400">{st.totalPrice?.toFixed(1)} Kč</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center space-x-1.5">
                    <span className="text-emerald-400 font-semibold">
                      {st.routeDistance >= 1000 ? `${(st.routeDistance / 1000).toFixed(1)} km` : `${st.routeDistance} m`}
                    </span>
                    <span>•</span>
                    <span>cca {st.walkingMinutes} min</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate max-w-[150px] mt-0.5">
                    {st.address?.split(',')[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shopping Cart Component */}
      <ShoppingCart
        strategy={strategy}
        userLat={lat}
        userLng={lng}
        userCity={city}
      />

      {/* Owned items summary if any */}
      {ownedItems.length > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Suroviny, které už máte doma ({ownedItems.length} ks)
            </span>
            <span className="text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
              Ušetřeno: +{savedMoney.toFixed(2)} Kč
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ownedItems.map((item: any) => (
              <span key={item.id} className="text-[11px] bg-zinc-900/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md">
                ✓ {item.ingredientName || item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div className="sticky bottom-20 bg-zinc-950/90 backdrop-blur-md pt-3 pb-1 border-t border-zinc-800/80">
        <Button 
          className="w-full py-3.5 text-base font-semibold" 
          onClick={() => navigate(`/recipe/${variationId}`)}
        >
          {hasItemsToBuy ? 'Mám nakoupeno — jdeme vařit! 👨‍🍳' : 'Vše máte doma — rovnou vařit! 👨‍🍳'}
        </Button>
      </div>
    </div>
  );
};

export default ShoppingPage;
