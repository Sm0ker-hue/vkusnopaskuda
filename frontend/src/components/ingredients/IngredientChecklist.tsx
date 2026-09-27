import React from 'react';
import { Ingredient } from '../../types';
import { IngredientItem } from './IngredientItem';
import { useInventoryStore } from '../../stores/inventoryStore';

interface IngredientChecklistProps {
  ingredients: Ingredient[];
}

export const IngredientChecklist: React.FC<IngredientChecklistProps> = ({ ingredients }) => {
  const { availableIngredientIds, toggleIngredient } = useInventoryStore();

  return (
    <div className="space-y-2">
      {ingredients.map((ing) => (
        <IngredientItem
          key={ing.id}
          ingredient={ing}
          isChecked={availableIngredientIds.includes(ing.id)}
          onToggle={() => toggleIngredient(ing.id)}
        />
      ))}
    </div>
  );
};
