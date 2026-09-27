import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0-5
  max?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 5,
  className = '',
  interactive = false,
  onChange,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeScore = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`flex items-center space-x-1.5 ${className}`}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= activeScore;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            className={`transition-transform focus:outline-none ${
              interactive
                ? 'cursor-pointer hover:scale-125 active:scale-95 p-1'
                : 'cursor-default'
            }`}
            title={interactive ? `Hodnotit ${starValue} z ${max}` : undefined}
          >
            <Star
              className={`w-7 h-7 transition-colors duration-150 ${
                isFilled
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'text-zinc-600 hover:text-zinc-500'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
