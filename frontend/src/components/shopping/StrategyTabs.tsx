import React from 'react';

interface StrategyTabsProps {
  activeStrategy: 'cheapest' | 'closest' | 'optimal';
  onChange: (strategy: 'cheapest' | 'closest' | 'optimal') => void;
}

export const StrategyTabs: React.FC<StrategyTabsProps> = ({ activeStrategy, onChange }) => {
  const tabs = [
    { id: 'optimal', label: '⚡ Optimální' },
    { id: 'cheapest', label: '💰 Nejlevnější' },
    { id: 'closest', label: '📍 Nejbližší' },
  ] as const;

  return (
    <div className="flex bg-zinc-900 rounded-xl p-1 mb-4 border border-zinc-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
            activeStrategy === tab.id
              ? 'bg-amber-500 text-white shadow-md font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
