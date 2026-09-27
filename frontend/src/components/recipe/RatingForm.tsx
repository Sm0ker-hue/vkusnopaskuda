import React, { useState } from 'react';
import { StarRating } from '../ui/StarRating';
import { Button } from '../ui/Button';

interface RatingFormProps {
  onSubmit: (rating: number, comment?: string) => void;
  initialRating?: number;
}

const RATING_DESCRIPTIONS: Record<number, { text: string; emoji: string }> = {
  1: { text: 'Bohužel nechutnalo', emoji: '🙁' },
  2: { text: 'Průměrné', emoji: '😐' },
  3: { text: 'Dobré, splnilo očekávání', emoji: '🙂' },
  4: { text: 'Velmi chutné jídlo!', emoji: '😋' },
  5: { text: 'Dokonalé, jako z vyhlášené restaurace!', emoji: '🌟' },
};

export const RatingForm: React.FC<RatingFormProps> = ({ onSubmit, initialRating = 5 }) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSubmit(rating, comment.trim());
    setIsSubmitting(false);
  };

  const getRatingPlural = (num: number) => {
    if (num === 1) return 'hvězdičku';
    if (num >= 2 && num <= 4) return 'hvězdičky';
    return 'hvězdiček';
  };

  const desc = RATING_DESCRIPTIONS[rating] || RATING_DESCRIPTIONS[5];

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center space-y-5">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Jak vám jídlo chutnalo?</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Klikněte na počet hvězdiček od 1 do 5
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center space-y-2 py-2">
        <StarRating 
          rating={rating} 
          interactive={true}
          onChange={(newRating) => setRating(newRating)}
          className="scale-125"
        />
        <div className="text-sm font-medium text-amber-400 mt-2 flex items-center space-x-1.5">
          <span>{desc.emoji}</span>
          <span>{desc.text}</span>
          <span className="text-zinc-500">({rating}/5)</span>
        </div>
      </div>

      <div className="text-left space-y-1.5">
        <label className="text-xs text-zinc-400 font-medium">Poznámka nebo tip k receptu (volitelné):</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Např. Přidal jsem o lžičku víc hořčice a bylo to super..."
          rows={2}
          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>
      
      <Button 
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 text-base font-semibold"
      >
        Uložit hodnocení ({rating} {getRatingPlural(rating)})
      </Button>
    </form>
  );
};
