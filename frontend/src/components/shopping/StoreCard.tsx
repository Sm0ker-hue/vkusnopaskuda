import React from 'react';
import { Store } from '../../types';
import { MapPin, Navigation, ExternalLink, Footprints, Compass } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface StoreCardProps {
  store: Store;
  totalPrice?: number;
  userLat?: number;
  userLng?: number;
  userCity?: string;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  store,
  totalPrice,
  userCity,
}) => {
  const handleNavigate = () => {
    // Exact GPS coordinates provide guaranteed pin on Google Maps without address ambiguity
    const dest = store.lat && store.lng
      ? `${store.lat},${store.lng}`
      : encodeURIComponent(store.address ? `${store.name}, ${store.address}` : `${store.name}, ${userCity || 'Česká republika'}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
    window.open(url, '_blank');
  };

  const handleNavigateMapyCz = () => {
    // Open in Mapy.cz (very popular and accurate for Czech pedestrian routing)
    const url = store.lat && store.lng
      ? `https://mapy.cz/turisticka?mid=&x=${store.lng}&y=${store.lat}&z=16`
      : `https://mapy.cz/zakladni?q=${encodeURIComponent(store.address || store.name)}`;
    window.open(url, '_blank');
  };

  const handleNavigateNearest = () => {
    // Queries Google Maps for the closest branch of this chain to user's real-time position
    const cleanChain = store.name.split('(')[0].trim();
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      cleanChain + ' supermarket'
    )}`;
    window.open(url, '_blank');
  };

  const routeMeters = store.routeDistance || Math.round(store.distance * 1.35);
  const formattedRouteDist =
    routeMeters >= 1000
      ? `${(routeMeters / 1000).toFixed(1)} km`
      : `${routeMeters} m`;

  const walkingMinutes = store.walkingMinutes || Math.max(1, Math.round(routeMeters / 75));

  return (
    <Card className="p-4 mb-3 border-amber-500/25 bg-zinc-900/90 shadow-md space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold text-white tracking-tight">{store.name}</span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
              Nejbližší pobočka
            </span>
          </div>

          {/* Concrete physical verified address */}
          {store.address && (
            <div className="flex items-start text-xs text-zinc-300">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="font-medium text-zinc-200">{store.address}</span>
            </div>
          )}

          {/* Route distance and walking time */}
          <div className="flex items-center text-xs text-amber-400 font-medium space-x-2 pt-0.5">
            <div className="flex items-center text-emerald-400">
              <Footprints className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
              <span>{formattedRouteDist} po trase</span>
            </div>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300">cca {walkingMinutes} min pěšky</span>
          </div>
        </div>

        {totalPrice !== undefined && (
          <div className="text-right flex-shrink-0 pl-3">
            <div className="text-lg font-bold text-amber-400">
              {totalPrice.toFixed(2)} Kč
            </div>
            <div className="text-[10px] text-zinc-500">odhad košíku</div>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs py-2.5 hover:border-amber-500 hover:text-amber-400 flex items-center justify-center space-x-2 bg-zinc-950/60"
          onClick={handleNavigate}
          title="Otevřít pěší trasu v Google Mapách s přesnými GPS souřadnicemi pobočky"
        >
          <Navigation className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-semibold">Pěší navigace do prodejny (Google Mapy)</span>
          <ExternalLink className="w-3 h-3 text-zinc-500 ml-0.5" />
        </Button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleNavigateMapyCz}
            className="flex-1 text-[11px] text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center space-x-1 border border-zinc-700/60"
            title="Otevřít v českých Mapy.cz"
          >
            <Compass className="w-3 h-3 text-red-400" />
            <span>Otevřít v Mapy.cz</span>
          </button>

          <button
            onClick={handleNavigateNearest}
            className="flex-1 text-[11px] text-zinc-400 hover:text-amber-400 bg-zinc-800/60 hover:bg-zinc-800 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center space-x-1 border border-zinc-700/60"
            title="Navigovat k nejbližší pobočce z živé GPS polohy"
          >
            <span>Hledat v Google Mapách 📍</span>
          </button>
        </div>
      </div>
    </Card>
  );
};
