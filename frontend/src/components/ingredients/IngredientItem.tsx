import React from 'react';
import { Ingredient } from '../../types';
import { Checkbox } from '../ui/Checkbox';

interface IngredientItemProps {
  ingredient: Ingredient;
  isChecked: boolean;
  onToggle: () => void;
}

export const IngredientItem: React.FC<IngredientItemProps> = ({ ingredient, isChecked, onToggle }) => {
  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
        isChecked ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900 border-zinc-800'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center space-x-3">
        <Checkbox 
          checked={isChecked} 
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()} 
        />
        <span className={`text-sm ${isChecked ? 'text-amber-500 line-through' : 'text-white'}`}>
          {ingredient.name}
        </span>
      </div>
      <span className="text-sm text-zinc-400">
        {ingredient.amount} {ingredient.unit}
      </span>
    </div>
  );
};
