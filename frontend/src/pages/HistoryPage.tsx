import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Clock, Star, Trash2, RotateCcw, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useHistoryStore } from '../stores/historyStore';
import { CZECH_ALLERGENS } from '../types';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { records, removeRecord, clearHistory } = useHistoryStore();

  const totalCooked = records.length;
  const totalSaved = records.reduce((sum, r) => sum + (r.savedMoney || 0), 0);
  const avgRating =
    totalCooked > 0
      ? (records.reduce((sum, r) => sum + r.rating, 0) / totalCooked).toFixed(1)
      : '0.0';

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('cs-CZ', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Nedávno';
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '30 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours} hod ${mins} min` : `${hours} hod`;
    }
    return `${mins} min`;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Historie vaření</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Přehled vámi připravených jídel, udělených hodnocení a ušetřených peněz.
          </p>
        </div>

        {totalCooked > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Opravdu si přejete smazat celou historii vaření?')) {
                clearHistory();
              }
            }}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center space-x-1 pt-1"
            title="Smazat celou historii"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vymazat</span>
          </button>
        )}
      </div>

      {/* Stats Summary Bar */}
      {totalCooked > 0 && (
        <div className="grid grid-cols-3 gap-2.5 bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl">
          <div className="text-center">
            <span className="text-[11px] text-zinc-400 block">Uvařeno</span>
            <span className="text-lg font-bold text-white flex items-center justify-center space-x-1">
              <ChefHat className="w-4 h-4 text-amber-500" />
              <span>{totalCooked} {totalCooked === 1 ? 'jídlo' : totalCooked < 5 ? 'jídla' : 'jídel'}</span>
            </span>
          </div>

          <div className="text-center border-x border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">Ušetřeno na akcích</span>
            <span className="text-lg font-bold text-emerald-400">
              +{totalSaved.toFixed(0)} Kč
            </span>
          </div>

          <div className="text-center">
            <span className="text-[11px] text-zinc-400 block">Průměrné skóre</span>
            <span className="text-lg font-bold text-yellow-400 flex items-center justify-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span>{avgRating}/5</span>
            </span>
          </div>
        </div>
      )}

      {/* Dishes List */}
      {totalCooked > 0 ? (
        <div className="space-y-4">
          {records.map((dish) => {
            const allergenDetails = (dish.allergens || [])
              .map((code) => CZECH_ALLERGENS.find((a) => a.code === code))
              .filter(Boolean);

            return (
              <Card
                key={dish.id}
                className="p-4 bg-zinc-900/95 border-zinc-800 hover:border-zinc-700 transition-all space-y-3 shadow-md"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-base leading-snug">
                      {dish.name}
                    </h3>

                    {/* Date and Duration */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center text-amber-500 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                        {formatDuration(dish.prepTimeMinutes)}
                      </span>
                      <span>•</span>
                      <span>{formatDate(dish.cookedAt)}</span>
                    </div>
                  </div>

                  {/* Saved Money Badge */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-zinc-500 block">Ušetřeno</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      +{dish.savedMoney ? dish.savedMoney.toFixed(2) : '0.00'} Kč
                    </span>
                  </div>
                </div>

                {/* Rating & Review */}
                <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < dish.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-zinc-700'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-semibold text-yellow-400 ml-1">
                        {dish.rating}/5
                      </span>
                    </div>
                  </div>

                  {dish.comment && (
                    <p className="text-xs text-zinc-300 italic">
                      „{dish.comment}“
                    </p>
                  )}
                </div>

                {/* Dietary Tags & Allergens */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {dish.dietaryTags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                    >
                      {tag}
                    </span>
                  ))}

                  {allergenDetails.map((a) => (
                    <span
                      key={a!.code}
                      className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/10 text-red-300 border border-red-500/20"
                      title={a!.name}
                    >
                      [{a!.code}] {a!.shortName}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs py-1.5 px-3 hover:border-amber-500 hover:text-amber-400 flex items-center space-x-1.5"
                    onClick={() => navigate(`/ingredients/${dish.variationId}`)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Uvařit znovu</span>
                  </Button>

                  <button
                    onClick={() => removeRecord(dish.id)}
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded transition-colors"
                    title="Odstranit z historie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
          <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-500">
            <ChefHat className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Zatím žádná historie vaření</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Vyberte si jídlo, zkontrolujte suroviny ve spíži a po uvaření se vám recept s hodnocením uloží sem.
            </p>
          </div>
          <Button
            className="text-xs py-2 px-4 flex items-center space-x-1.5"
            onClick={() => navigate('/')}
          >
            <span>Najít recept k uvaření</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
