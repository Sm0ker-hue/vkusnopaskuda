import React from 'react';
import { NutritionInfo as NutritionInfoType } from '../../types';

interface NutritionInfoProps {
  nutrition: NutritionInfoType;
}

export const NutritionInfo: React.FC<NutritionInfoProps> = ({ nutrition }) => {
  const items = [
    { label: 'Kalorie', value: `${nutrition.calories} kcal`, color: 'text-amber-500' },
    { label: 'Bílkoviny', value: `${nutrition.protein} g`, color: 'text-red-400' },
    { label: 'Tuky', value: `${nutrition.fat} g`, color: 'text-yellow-400' },
    { label: 'Sacharidy', value: `${nutrition.carbs} g`, color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 bg-zinc-900 rounded-xl p-3 border border-zinc-800">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className={`text-base font-bold ${item.color}`}>{item.value}</div>
          <div className="text-[10px] text-zinc-500 uppercase font-semibold mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
};
