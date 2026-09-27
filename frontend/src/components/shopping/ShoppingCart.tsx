import React from 'react';
import { ShoppingStrategy } from '../../types';
import { StoreCard } from './StoreCard';
import { Checkbox } from '../ui/Checkbox';
import { useCartStore } from '../../stores/cartStore';
import { PartyPopper } from 'lucide-react';

interface ShoppingCartProps {
  strategy: ShoppingStrategy;
  userLat?: number;
  userLng?: number;
  userCity?: string;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  strategy,
  userLat,
  userLng,
  userCity,
}) => {
  const { purchasedProductIds, toggleProductPurchase } = useCartStore();

  if (strategy.items.length === 0) {
    return (
      <div className="bg-gradient-to-b from-emerald-500/10 to-zinc-900 p-6 rounded-2xl border border-emerald-500/30 text-center space-y-3">
        <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <PartyPopper className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Všechny suroviny máte doma!</h3>
        <p className="text-sm text-zinc-300 max-w-sm mx-auto leading-relaxed">
          Do obchodu vůbec nemusíte. Vše potřebné máte ve spíži a ušetřili jste plnou cenu nákupu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-200 mb-3 flex items-center justify-between">
          <span>Doporučený obchod na trase</span>
          <span className="text-xs text-amber-500 font-normal">Nejvýhodnější poměr cen</span>
        </h2>
        {strategy.stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            totalPrice={strategy.totalPrice}
            userLat={userLat}
            userLng={userLng}
            userCity={userCity}
          />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-zinc-200">
            Chybějící položky k nákupu ({strategy.items.length} ks)
          </h2>
          <span className="text-xs text-zinc-400">Položky ze spíže byly vyřazeny</span>
        </div>

        <div className="space-y-2.5">
          {strategy.items.map(({ product, ingredient }) => {
            const isPurchased = purchasedProductIds.includes(product.id);
            return (
              <div 
                key={product.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isPurchased ? 'bg-amber-500/10 border-amber-500/30 opacity-75' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
                onClick={() => toggleProductPurchase(product.id)}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    checked={isPurchased} 
                    onChange={() => toggleProductPurchase(product.id)}
                    onClick={(e) => e.stopPropagation()} 
                  />
                  <div>
                    <p className={`text-sm font-medium ${isPurchased ? 'text-amber-400 line-through' : 'text-white'}`}>
                      {product.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-zinc-400 pt-0.5">
                      <span>Chybí pro: {ingredient.name} • {product.quantity} {product.unit}</span>
                      {product.discountValidUntil && (
                        <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-medium">
                          Akce do {product.discountValidUntil}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-400 whitespace-nowrap pl-2">
                  {product.price.toFixed(2)} Kč
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center">
          <span className="text-sm text-zinc-400">Cena chybějících položek:</span>
          <span className="text-xl font-bold text-amber-400">{strategy.totalPrice.toFixed(2)} Kč</span>
        </div>
      </div>
    </div>
  );
};
