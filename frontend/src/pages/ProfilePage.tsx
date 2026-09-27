import React, { useState, useEffect } from 'react';
import { usePreferencesStore } from '../stores/preferencesStore';
import { CZECH_ALLERGENS } from '../types';
import { Button } from '../components/ui/Button';
import {
  User,
  ShieldAlert,
  MapPin,
  Cloud,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  Wifi,
} from 'lucide-react';

const CZECH_SUPERMARKETS = [
  'Lidl',
  'Albert',
  'Billa',
  'Kaufland',
  'Tesco',
  'Penny Market',
  'Globus',
];

const CZECH_CITIES = ['Plzeň', 'Praha', 'Brno', 'Ostrava', 'Liberec', 'Olomouc'];

export const ProfilePage: React.FC = () => {
  const {
    isVegan,
    isVegetarian,
    isKeto,
    isGlutenFree,
    isLactoseFree,
    excludedAllergens,
    city,
    defaultStore,
    isSyncing,
    lastSynced,
    setVegan,
    setVegetarian,
    setKeto,
    setGlutenFree,
    setLactoseFree,
    setCity,
    setDefaultStore,
    toggleAllergen,
    clearAll,
    syncWithBackend,
    loadFromBackend,
  } = usePreferencesStore();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Pokus o načtení preferencí z cloudu při otevření
    loadFromBackend();
  }, [loadFromBackend]);

  const handleManualSync = async () => {
    const success = await syncWithBackend();
    if (success) {
      setSyncFeedback('Preference byly úspěšně uloženy do PostgreSQL databáze.');
    } else {
      setSyncFeedback('Jste v offline režimu. Nastavení je bezpečně uloženo v paměti zařízení.');
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    setSyncFeedback('Offline mezipaměť (cache) byla promazána.');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Profile Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Můj Profil</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personalizace receptů, dietní filtry a ukládání do DB
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center">
                <Wifi className="w-3 h-3 mr-1" /> PWA Offline Ready
              </span>
              {lastSynced && (
                <span className="text-[10px] text-zinc-500">
                  Synchro: {lastSynced}
                </span>
              )}
            </div>
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-800/90 border border-zinc-700 text-xs text-amber-300 flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* 1. Dietní preference */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
            Dietní omezení a stravovací styly
          </h2>
          <span className="text-[11px] text-zinc-500">Aktivní ve vyhledávání</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setVegan(!isVegan)}
            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
              isVegan
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span>🌱 Veganské</span>
            {isVegan && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setVegetarian(!isVegetarian)}
            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
              isVegetarian
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span>🥗 Vegetariánské</span>
            {isVegetarian && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setKeto(!isKeto)}
            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
              isKeto
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span>🥩 Keto / Low-Carb</span>
            {isKeto && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            type="button"
            onClick={() => setGlutenFree(!isGlutenFree)}
            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
              isGlutenFree
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span>🌾❌ Bez lepku</span>
            {isGlutenFree && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={() => setLactoseFree(!isLactoseFree)}
            className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between col-span-2 ${
              isLactoseFree
                ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <span>🥛❌ Bez laktózy (mléčných výrobků)</span>
            {isLactoseFree && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* 2. Správce alergenů (1-14) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm text-left">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-500" />
              Vyloučit alergeny (ČR 1–14)
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Kliknutím vyloučíte potraviny z receptů i košíku
            </p>
          </div>
          {excludedAllergens.length > 0 && (
            <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold">
              {excludedAllergens.length} vybráno
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
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
                <div className="leading-tight overflow-hidden">
                  <span className="block font-medium truncate">{allergen.shortName}</span>
                  <span className="text-[10px] text-zinc-500 line-clamp-1">{allergen.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Nákupní a geolokační preference */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-white flex items-center">
          <MapPin className="w-4 h-4 mr-1.5 text-amber-500" />
          Výchozí město a oblíbený supermarket
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">
              Region / Město pro vyhledávání slev:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CZECH_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    city.toLowerCase() === c.toLowerCase()
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                      : 'bg-zinc-950/60 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1.5">
              Preferovaný obchodní řetězec:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CZECH_SUPERMARKETS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDefaultStore(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    defaultStore.toLowerCase() === st.toLowerCase()
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                      : 'bg-zinc-950/60 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tlačítka synchronizace a správy mezipaměti */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-2xl shadow-lg flex items-center justify-center space-x-2"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Ukládám do PostgreSQL...</span>
            </>
          ) : (
            <>
              <Cloud className="w-5 h-5" />
              <span>Uložit a synchronizovat preference</span>
            </>
          )}
        </Button>

        <div className="flex items-center space-x-2 pt-1">
          <button
            type="button"
            onClick={clearAll}
            className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Obnovit výchozí filtry
          </button>

          <button
            type="button"
            onClick={handleClearCache}
            className="py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-red-400 flex items-center space-x-1.5 transition-colors"
            title="Promazat offline mezipaměť"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Smazat cache</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
