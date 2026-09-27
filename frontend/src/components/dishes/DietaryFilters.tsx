import React, { useState } from 'react';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { CZECH_ALLERGENS } from '../../types';
import { ShieldAlert, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

export const DietaryFilters: React.FC = () => {
  const [showAllergens, setShowAllergens] = useState(false);
  const {
    isVegan,
    isVegetarian,
    isKeto,
    isGlutenFree,
    isLactoseFree,
    excludedAllergens,
    setVegan,
    setVegetarian,
    setKeto,
    setGlutenFree,
    setLactoseFree,
    toggleAllergen,
    clearAll,
  } = usePreferencesStore();

  const totalActive =
    (isVegan ? 1 : 0) +
    (isVegetarian ? 1 : 0) +
    (isKeto ? 1 : 0) +
    (isGlutenFree ? 1 : 0) +
    (isLactoseFree ? 1 : 0) +
    excludedAllergens.filter((c) => c !== 1 && c !== 7).length;

  return (
    <div className="w-full space-y-2.5">
      {/* Quick Diet Chips */}
      <div className="flex flex-wrap items-center gap-1.5 justify-center">
        <button
          type="button"
          onClick={() => setVegan(!isVegan)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1 ${
            isVegan
              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm font-bold'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span>🌱 Veganské</span>
          {isVegan && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setVegetarian(!isVegetarian)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1 ${
            isVegetarian && !isVegan
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span>🥗 Vegetariánské</span>
          {isVegetarian && !isVegan && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setKeto(!isKeto)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1 ${
            isKeto
              ? 'bg-rose-500 text-zinc-950 border-rose-400 font-bold shadow-sm'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span>🥩 Keto / Low-Carb</span>
          {isKeto && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setGlutenFree(!isGlutenFree)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1 ${
            isGlutenFree
              ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-sm'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span>🌾❌ Bez lepku</span>
          {isGlutenFree && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setLactoseFree(!isLactoseFree)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1 ${
            isLactoseFree
              ? 'bg-sky-500 text-zinc-950 border-sky-400 font-bold shadow-sm'
              : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span>🥛❌ Bez laktózy</span>
          {isLactoseFree && <Check className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setShowAllergens((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center space-x-1 ${
            showAllergens || excludedAllergens.length > 0
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 mr-0.5" />
          <span>Alergeny ČR (1–14)</span>
          {excludedAllergens.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center">
              {excludedAllergens.length}
            </span>
          )}
          {showAllergens ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>

        {totalActive > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-zinc-500 hover:text-red-400 underline decoration-zinc-700 pl-1"
          >
            Smazat filtry
          </button>
        )}
      </div>

      {/* Expandable Czech Official Allergen Picker (1-14) */}
      {showAllergens && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-fade-in shadow-xl text-left">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Vyloučit alergeny (oficiální české značení 1–14)
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Vyberte alergeny, kterým se chcete v receptech a nákupech vyhnout
              </p>
            </div>
            <button
              onClick={() => setShowAllergens(false)}
              className="text-zinc-500 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {CZECH_ALLERGENS.map((allergen) => {
              const isExcluded = excludedAllergens.includes(allergen.code);
              return (
                <button
                  key={allergen.code}
                  type="button"
                  onClick={() => toggleAllergen(allergen.code)}
                  className={`p-2 rounded-xl text-left text-xs border transition-all flex items-start space-x-2 ${
                    isExcluded
                      ? 'bg-red-500/15 border-red-500/50 text-red-300 font-semibold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                      isExcluded ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {allergen.code}
                  </span>
                  <div className="leading-tight">
                    <span className="block font-medium">{allergen.shortName}</span>
                    <span className="text-[10px] text-zinc-500 line-clamp-1">{allergen.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
