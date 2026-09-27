import React from 'react';
import { Check, CheckCircle2, CircleDot } from 'lucide-react';

export type StepStatus = 'completed' | 'in_progress' | 'pending';

interface RecipeStepProps {
  step: string;
  index: number;
  status: StepStatus;
  onToggle: () => void;
}

export const RecipeStep: React.FC<RecipeStepProps> = ({ step, index, status, onToggle }) => {
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  return (
    <div
      onClick={onToggle}
      className={`relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border ${
        isCompleted
          ? 'bg-zinc-900/40 border-emerald-500/30 text-zinc-400'
          : isInProgress
          ? 'bg-gradient-to-r from-amber-500/15 to-zinc-900 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
      }`}
    >
      <div className="flex items-start space-x-3.5">
        {/* Status Indicator Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isCompleted ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          ) : isInProgress ? (
            <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-sm shadow-md animate-pulse">
              {index + 1}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-medium text-sm border border-zinc-700/60">
              {index + 1}
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isCompleted
                  ? 'text-emerald-400'
                  : isInProgress
                  ? 'text-amber-400 font-bold flex items-center'
                  : 'text-zinc-500'
              }`}
            >
              {isInProgress && <CircleDot className="w-3 h-3 mr-1 animate-ping" />}
              {isCompleted ? '✓ Dokončeno' : isInProgress ? 'Provádí se (Krok ' + (index + 1) + ')' : 'Krok ' + (index + 1)}
            </span>

            {/* Status Badge */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isInProgress
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700/50'
              }`}
            >
              {isCompleted ? 'Hotovo' : isInProgress ? 'Právě probíhá' : 'Čeká'}
            </span>
          </div>

          <p
            className={`text-sm leading-relaxed transition-all ${
              isCompleted
                ? 'line-through text-zinc-500'
                : isInProgress
                ? 'text-white font-medium'
                : 'text-zinc-300'
            }`}
          >
            {step}
          </p>

          {/* Quick Action Button on the active step */}
          {isInProgress && (
            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Označit krok {index + 1} jako hotový</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
