import { create } from 'zustand';
import { apiClient } from '../api/client';

interface PreferencesState {
  isVegan: boolean;
  isVegetarian: boolean;
  isKeto: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  excludedAllergens: number[]; // Czech allergen numbers 1-14
  city: string;
  defaultStore: string;
  isSyncing: boolean;
  lastSynced: string | null;

  setVegan: (val: boolean) => void;
  setVegetarian: (val: boolean) => void;
  setKeto: (val: boolean) => void;
  setGlutenFree: (val: boolean) => void;
  setLactoseFree: (val: boolean) => void;
  setCity: (city: string) => void;
  setDefaultStore: (store: string) => void;
  toggleAllergen: (code: number) => void;
  clearAll: () => void;
  getSummaryText: () => string;
  syncWithBackend: () => Promise<boolean>;
  loadFromBackend: () => Promise<boolean>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => {
  let initial: Record<string, any> = {};
  try {
    const saved = localStorage.getItem('vkusno_preferences');
    if (saved) {
      initial = JSON.parse(saved);
    }
  } catch (err) {
    console.debug('Failed to parse saved preferences:', err);
  }

  const save = (state: Partial<PreferencesState>) => {
    const payload = {
      isVegan: state.isVegan ?? get().isVegan,
      isVegetarian: state.isVegetarian ?? get().isVegetarian,
      isKeto: state.isKeto ?? get().isKeto,
      isGlutenFree: state.isGlutenFree ?? get().isGlutenFree,
      isLactoseFree: state.isLactoseFree ?? get().isLactoseFree,
      excludedAllergens: state.excludedAllergens ?? get().excludedAllergens,
      city: state.city ?? get().city,
      defaultStore: state.defaultStore ?? get().defaultStore,
    };
    localStorage.setItem('vkusno_preferences', JSON.stringify(payload));
  };

  return {
    isVegan: initial.isVegan || false,
    isVegetarian: initial.isVegetarian || false,
    isKeto: initial.isKeto || false,
    isGlutenFree: initial.isGlutenFree || false,
    isLactoseFree: initial.isLactoseFree || false,
    excludedAllergens: initial.excludedAllergens || [],
    city: initial.city || 'Plzeň',
    defaultStore: initial.defaultStore || 'Lidl',
    isSyncing: false,
    lastSynced: localStorage.getItem('vkusno_preferences_last_synced') || null,

    setVegan: (val) => {
      set({ isVegan: val, isVegetarian: val ? true : get().isVegetarian });
      save({ isVegan: val, isVegetarian: val ? true : get().isVegetarian });
    },
    setVegetarian: (val) => {
      set({ isVegetarian: val });
      save({ isVegetarian: val });
    },
    setKeto: (val) => {
      set({ isKeto: val });
      save({ isKeto: val });
    },
    setGlutenFree: (val) => {
      const currentAllergens = get().excludedAllergens;
      const nextAllergens = val
        ? Array.from(new Set([...currentAllergens, 1]))
        : currentAllergens.filter((c) => c !== 1);
      set({ isGlutenFree: val, excludedAllergens: nextAllergens });
      save({ isGlutenFree: val, excludedAllergens: nextAllergens });
    },
    setLactoseFree: (val) => {
      const currentAllergens = get().excludedAllergens;
      const nextAllergens = val
        ? Array.from(new Set([...currentAllergens, 7]))
        : currentAllergens.filter((c) => c !== 7);
      set({ isLactoseFree: val, excludedAllergens: nextAllergens });
      save({ isLactoseFree: val, excludedAllergens: nextAllergens });
    },
    setCity: (city) => {
      set({ city });
      save({ city });
    },
    setDefaultStore: (store) => {
      set({ defaultStore: store });
      save({ defaultStore: store });
    },
    toggleAllergen: (code) => {
      const current = get().excludedAllergens;
      const updated = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code];
      const isGlutenFree = updated.includes(1);
      const isLactoseFree = updated.includes(7);
      set({ excludedAllergens: updated, isGlutenFree, isLactoseFree });
      save({ excludedAllergens: updated, isGlutenFree, isLactoseFree });
    },
    clearAll: () => {
      const cleared = {
        isVegan: false,
        isVegetarian: false,
        isKeto: false,
        isGlutenFree: false,
        isLactoseFree: false,
        excludedAllergens: [],
        city: 'Plzeň',
        defaultStore: 'Lidl',
      };
      set(cleared);
      localStorage.removeItem('vkusno_preferences');
    },
    getSummaryText: () => {
      const parts: string[] = [];
      const s = get();
      if (s.isVegan) parts.push('Veganské 🌱');
      else if (s.isVegetarian) parts.push('Vegetariánské 🥗');
      if (s.isKeto) parts.push('Keto / Low-Carb 🥩');
      if (s.isGlutenFree) parts.push('Bez lepku 🌾❌');
      if (s.isLactoseFree) parts.push('Bez laktózy 🥛❌');
      return parts.join(', ');
    },
    syncWithBackend: async () => {
      const s = get();
      set({ isSyncing: true });
      try {
        await apiClient('/users/me/settings', {
          method: 'PUT',
          body: JSON.stringify({
            preferences: {
              is_vegan: s.isVegan,
              is_vegetarian: s.isVegetarian,
              is_keto: s.isKeto,
              is_gluten_free: s.isGlutenFree,
              is_lactose_free: s.isLactoseFree,
              city: s.city,
              default_store: s.defaultStore,
            },
            allergies: s.excludedAllergens,
          }),
        });
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        set({ isSyncing: false, lastSynced: now });
        localStorage.setItem('vkusno_preferences_last_synced', now);
        return true;
      } catch (err) {
        console.warn('Sync with cloud failed (offline), saved to localStorage only:', err);
        set({ isSyncing: false });
        return false;
      }
    },
    loadFromBackend: async () => {
      set({ isSyncing: true });
      try {
        const res = await apiClient<any>('/users/me/settings');
        if (res?.preferences) {
          const p = res.preferences;
          const a = res.allergies || [];
          set({
            isVegan: Boolean(p.is_vegan),
            isVegetarian: Boolean(p.is_vegetarian),
            isKeto: Boolean(p.is_keto),
            isGlutenFree: Boolean(p.is_gluten_free),
            isLactoseFree: Boolean(p.is_lactose_free),
            city: p.city || 'Plzeň',
            defaultStore: p.default_store || 'Lidl',
            excludedAllergens: a,
            isSyncing: false,
          });
          save({
            isVegan: Boolean(p.is_vegan),
            isVegetarian: Boolean(p.is_vegetarian),
            isKeto: Boolean(p.is_keto),
            isGlutenFree: Boolean(p.is_gluten_free),
            isLactoseFree: Boolean(p.is_lactose_free),
            city: p.city || 'Plzeň',
            defaultStore: p.default_store || 'Lidl',
            excludedAllergens: a,
          });
          return true;
        }
        set({ isSyncing: false });
        return false;
      } catch (err) {
        set({ isSyncing: false });
        return false;
      }
    },
  };
});
