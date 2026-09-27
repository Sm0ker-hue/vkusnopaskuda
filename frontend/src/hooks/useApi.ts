import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Dish, RecipeVariation } from '../types';

export const useSearchDishes = (query: string) => {
  return useQuery({
    queryKey: ['dishes', query],
    queryFn: () => apiClient<Dish[]>(`/dishes/search?q=${encodeURIComponent(query)}`),
    enabled: !!query,
  });
};

export const useDishVariations = (dishId: string) => {
  return useQuery({
    queryKey: ['variations', dishId],
    queryFn: () => apiClient<RecipeVariation[]>(`/dishes/${dishId}/variations`),
    enabled: !!dishId,
  });
};
