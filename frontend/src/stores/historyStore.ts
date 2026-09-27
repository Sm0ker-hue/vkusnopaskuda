import { create } from 'zustand';
import { CookedDishRecord } from '../types';

interface HistoryState {
  records: CookedDishRecord[];
  addRecord: (record: Omit<CookedDishRecord, 'id' | 'cookedAt'>) => void;
  removeRecord: (id: string) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = 'vkusno_cooking_history';

export const useHistoryStore = create<HistoryState>((set, get) => {
  const loadSaved = (): CookedDishRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.debug('Failed to parse cooking history:', err);
    }
    return [
      {
        id: 'hist-default-1',
        variationId: 'var-1',
        name: 'Tradiční česká svíčková na smetaně',
        cookedAt: new Date(Date.now() - 86400000).toISOString(),
        prepTimeMinutes: 145,
        rating: 5,
        comment: 'Famózní omáčka, jemná a vyvážená!',
        savedMoney: 64.80,
        allergens: [1, 7, 9, 10],
        dietaryTags: ['tradiční'],
      },
    ];
  };

  const save = (records: CookedDishRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  };

  return {
    records: loadSaved(),

    addRecord: (newDish) => {
      const fullRecord: CookedDishRecord = {
        ...newDish,
        id: `cook-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        cookedAt: new Date().toISOString(),
      };
      const updated = [fullRecord, ...get().records];
      set({ records: updated });
      save(updated);
    },

    removeRecord: (id) => {
      const updated = get().records.filter((r) => r.id !== id);
      set({ records: updated });
      save(updated);
    },

    clearHistory: () => {
      set({ records: [] });
      localStorage.removeItem(STORAGE_KEY);
    },
  };
});
