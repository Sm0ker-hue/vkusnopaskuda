import React from 'react';
import { Clock, Flame, ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { RecipeVariation } from '../../types';

interface VariationCardProps {
  variation: RecipeVariation;
  onClick: () => void;
}

export const VariationCard: React.FC<VariationCardProps> = ({ variation, onClick }) => {
  return (
    <Card hoverable className="cursor-pointer overflow-hidden border-zinc-800 hover:border-amber-500/50" onClick={onClick}>
      {variation.image && (
        <div className="w-full h-44 bg-zinc-800">
          <img src={variation.image} alt={variation.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-3">
        {/* Dietary Badges */}
        <div className="flex flex-wrap gap-1">
          {variation.dietaryTags?.map((tag) => (
            <span
              key={tag}
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            >
              {tag === 'vegan'
                ? '🌱 Vegan'
                : tag === 'vegetarian'
                ? '🥗 Vegetarián'
                : tag === 'bez-lepku'
                ? '🌾 Bez lepku'
                : tag === 'bez-laktozy'
                ? '🥛 Bez laktózy'
                : tag}
            </span>
          ))}
          {variation.allergens && variation.allergens.length > 0 && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center"
              title={`Obsahuje české alergeny: ${variation.allergens.join(', ')}`}
            >
              <ShieldAlert className="w-3 h-3 mr-1 text-amber-500" />
              Alergeny: {variation.allergens.join(', ')}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">{variation.name}</h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {variation.description}
          </p>
        </div>
        
        <div className="flex items-center text-xs text-zinc-400 pt-1 border-t border-zinc-800/80">
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <span>Celkem: {variation.prepTime + variation.cookTime} min</span>
          </div>
        </div>

        {/* KBJU Nutritional Breakdown (BJU + Kalorie) */}
        <div className="grid grid-cols-4 gap-1.5 py-2 px-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800/80 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 block uppercase font-medium">Kalorie</span>
            <span className="text-xs font-bold text-amber-400 flex items-center justify-center">
              <Flame className="w-3 h-3 mr-0.5 text-amber-500 inline" />
              {variation.nutrition?.calories || 450}
            </span>
          </div>
          <div className="space-y-0.5 border-l border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 block uppercase font-medium">Bílkoviny</span>
            <span className="text-xs font-bold text-emerald-400">
              {variation.nutrition?.protein || 25} g
            </span>
          </div>
          <div className="space-y-0.5 border-l border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 block uppercase font-medium">Tuky</span>
            <span className="text-xs font-bold text-rose-400">
              {variation.nutrition?.fat || 15} g
            </span>
          </div>
          <div className="space-y-0.5 border-l border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 block uppercase font-medium">Sacharidy</span>
            <span className="text-xs font-bold text-blue-400">
              {variation.nutrition?.carbs || 40} g
            </span>
          </div>
        </div>
        
        {variation.ingredients && variation.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {variation.ingredients.slice(0, 3).map((ing) => (
              <Badge key={ing.id} variant="default" className="text-[11px]">
                {ing.name}
              </Badge>
            ))}
            {variation.ingredients.length > 3 && (
              <Badge variant="default" className="text-[11px]">
                +{variation.ingredients.length - 3} dalších
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
