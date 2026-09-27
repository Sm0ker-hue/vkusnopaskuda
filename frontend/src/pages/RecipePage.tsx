import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NutritionInfo } from '../components/recipe/NutritionInfo';
import { RecipeStep, StepStatus } from '../components/recipe/RecipeStep';
import { RatingForm } from '../components/recipe/RatingForm';
import { ArrowLeft, Star, CheckCircle2, RotateCcw, BookOpen, ArrowRight, Utensils } from 'lucide-react';
import { apiClient } from '../api/client';
import { useHistoryStore } from '../stores/historyStore';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useRecipeStore } from '../stores/recipeStore';
import { findMatchingPreset, CZECH_RECIPE_PRESETS } from '../data/czechRecipes';

const RecipePage: React.FC = () => {
  const { variationId } = useParams();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userRating, setUserRating] = useState<{ score: number; comment?: string } | null>(null);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const { addRecord } = useHistoryStore();

  const {
    activeRecipeName,
    activeNutrition,
    activeSteps,
    setActiveDetails,
  } = useRecipeStore();

  const [recipeTitle, setRecipeTitle] = useState<string>(activeRecipeName || 'Vybraný recept');
  const [nutrition, setNutrition] = useState(activeNutrition || { calories: 520, protein: 22, fat: 18, carbs: 65 });
  const [instructions, setInstructions] = useState<string[]>(() => {
    if (activeSteps && activeSteps.length > 0) {
      return activeSteps.map((s) => s.instruction);
    }
    const preset = findMatchingPreset(activeRecipeName);
    if (preset) {
      return preset.steps.map((s) => s.instruction);
    }
    return CZECH_RECIPE_PRESETS.bramboracka.steps.map((s) => s.instruction);
  });

  useEffect(() => {
    if (variationId) {
      if (activeRecipeName) {
        setRecipeTitle(activeRecipeName);
      }
      if (activeNutrition) {
        setNutrition(activeNutrition);
      }
      if (activeSteps && activeSteps.length > 0) {
        setInstructions(activeSteps.map((s) => s.instruction));
      } else {
        const preset = findMatchingPreset(activeRecipeName);
        if (preset) {
          setInstructions(preset.steps.map((s) => s.instruction));
          setNutrition(preset.nutrition);
          setRecipeTitle(preset.name);
        }
      }

      // If UUID from backend, attempt to fetch backend details (Gemini-generated steps & nutrition)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variationId);
      if (isUuid) {
        apiClient<any>(`/recipes/${variationId}/details`)
          .then((data) => {
            if (data?.steps && data.steps.length > 0) {
              const mappedSteps = data.steps.map((s: any) => s.instruction || s);
              setInstructions(mappedSteps);
            }
            if (data?.name) {
              setRecipeTitle(data.name);
            }
            if (data?.nutrition) {
              setNutrition(data.nutrition);
            }
            if (data) {
              setActiveDetails({
                id: variationId,
                name: data.name || recipeTitle,
                description: data.description,
                nutrition: data.nutrition,
                steps: data.steps,
              });
            }
          })
          .catch((err) => {
            console.warn('Could not load recipe steps from backend, using preset:', err);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variationId, activeRecipeName]);

  const totalSteps = instructions.length;
  const completedCount = completedSteps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // The active step is the first step not yet completed
  const activeStepIndex = instructions.findIndex((_, idx) => !completedSteps.includes(idx));
  const allCompleted = totalSteps > 0 && completedCount === totalSteps;

  const handleToggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      if (prev.includes(index)) {
        // Unmark this step and all subsequent steps
        return prev.filter((i) => i < index);
      } else {
        // Automatically complete this step AND ALL preceding steps (0..index)
        const allUpToIndex = Array.from({ length: index + 1 }, (_, i) => i);
        return Array.from(new Set([...prev, ...allUpToIndex]));
      }
    });
  };

  const handleAdvanceNextStep = () => {
    if (activeStepIndex !== -1 && activeStepIndex < totalSteps) {
      handleToggleStep(activeStepIndex);
    }
  };

  const handleResetSteps = () => {
    setCompletedSteps([]);
  };

  const handleRatingSubmit = async (score: number, comment?: string) => {
    setUserRating({ score, comment });

    // Save dish record into persistent history store
    if (!savedToHistory) {
      const { isVegan, isVegetarian, isGlutenFree, isLactoseFree } = usePreferencesStore.getState();
      const dietaryTags: string[] = [];
      if (isVegan) dietaryTags.push('vegan');
      if (isVegetarian) dietaryTags.push('vegetariánské');
      if (isGlutenFree) dietaryTags.push('bez lepku');
      if (isLactoseFree) dietaryTags.push('bez laktózy');
      if (dietaryTags.length === 0) dietaryTags.push('tradiční');

      addRecord({
        variationId: variationId || 'var-custom',
        name: recipeTitle,
        prepTimeMinutes: 45,
        rating: score,
        comment: comment || undefined,
        savedMoney: 58.50,
        allergens: [1, 9],
        dietaryTags,
      });
      setSavedToHistory(true);
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(variationId || '');
      if (isUuid) {
        await apiClient(`/ratings/${variationId}/rate`, {
          method: 'POST',
          body: JSON.stringify({ score, comment }),
        });
      }
    } catch (e) {
      console.warn('Could not post rating to server, saved locally:', e);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Navigation Breadcrumb */}
      <div>
        <Link 
          to={variationId ? `/shopping/${variationId}` : '/'}
          className="inline-flex items-center text-xs text-zinc-400 hover:text-amber-400 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Zpět k nákupnímu seznamu
        </Link>

        <div className="flex items-center space-x-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
            <Utensils className="w-3 h-3 mr-1" />
            Recept krok za krokem
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">{recipeTitle}</h1>
        <NutritionInfo nutrition={nutrition} />
      </div>

      {/* Cooking Progress Bar & Tracker */}
      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">
            {allCompleted ? (
              <span className="text-emerald-400 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" /> Všechny kroky hotové!
              </span>
            ) : (
              <span>
                Právě provádíte: <strong className="text-amber-400">Krok {activeStepIndex + 1}</strong> z {totalSteps}
              </span>
            )}
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-zinc-400 font-medium">
              {completedCount} z {totalSteps} ({progressPercent} %)
            </span>
            {completedCount > 0 && (
              <button
                onClick={handleResetSteps}
                className="text-zinc-500 hover:text-zinc-300 flex items-center text-[10px] space-x-0.5"
                title="Začít vaření od začátku"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              allCompleted
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-amber-500 to-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Advance step CTA button */}
        {!allCompleted && totalSteps > 0 && (
          <button
            onClick={handleAdvanceNextStep}
            className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.99]"
          >
            <CheckCircle2 className="w-4 h-4 text-zinc-950" />
            <span>Dokončit krok {activeStepIndex + 1} a přejít na další ({activeStepIndex + 1} z {totalSteps})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Steps List */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
          <span>Postup přípravy</span>
          <span className="text-xs font-normal text-zinc-400">
            Kliknutím na krok potvrdíte jeho splnění
          </span>
        </h2>

        <div className="space-y-3">
          {instructions.map((step, idx) => {
            let status: StepStatus = 'pending';
            if (completedSteps.includes(idx)) {
              status = 'completed';
            } else if (idx === activeStepIndex) {
              status = 'in_progress';
            }

            return (
              <RecipeStep
                key={idx}
                index={idx}
                step={step}
                status={status}
                onToggle={() => handleToggleStep(idx)}
              />
            );
          })}
        </div>
      </div>

      {/* Completion Banner */}
      {allCompleted && (
        <div className="p-6 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-zinc-900 border border-emerald-500/40 rounded-2xl text-center space-y-2 animate-bounce-once">
          <div className="flex justify-center text-3xl">🎉 👨‍🍳</div>
          <h3 className="text-xl font-bold text-emerald-400">Vaření je úspěšně dokončeno!</h3>
          <p className="text-sm text-zinc-300 max-w-md mx-auto">
            Všechny kroky receptu máte hotové. Přejeme vám dobrou chuť! Nezapomeňte níže ohodnotit, jak vám jídlo chutnalo.
          </p>
        </div>
      )}

      {/* Rating Section */}
      <div className="pt-4 border-t border-zinc-800">
        {userRating ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
            <div className="flex justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 font-bold text-lg">
                Uděleno {userRating.score} z 5 hvězdiček!
              </p>
              <div className="flex justify-center items-center space-x-1 my-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < userRating.score ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`} 
                  />
                ))}
              </div>
              {userRating.comment && (
                <p className="text-xs text-zinc-300 italic bg-zinc-900/60 p-2.5 rounded-lg max-w-sm mx-auto">
                  „{userRating.comment}“
                </p>
              )}
              <p className="text-xs text-zinc-400 mt-2">Recept a hodnocení byly uloženy do vaší historie vaření.</p>
              <div className="pt-2">
                <Link
                  to="/history"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Zobrazit v historii vaření →</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <RatingForm onSubmit={handleRatingSubmit} />
        )}
      </div>
    </div>
  );
};

export default RecipePage;
