import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface RatingDisplayProps {
    rating: number;
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
    showNumber?: boolean;
    reviewCount?: number;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
    rating,
    maxRating = 5,
    size = 'md',
    interactive = false,
    onRatingChange,
    showNumber = false,
    reviewCount,
}) => {
    const [hoverRating, setHoverRating] = React.useState(0);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const handleClick = (value: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(value);
        }
    };

    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
                {Array.from({ length: maxRating }, (_, i) => {
                    const starValue = i + 1;
                    const isFilled = starValue <= displayRating;
                    const isPartiallyFilled = !isFilled && starValue - 0.5 <= displayRating;

                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={!interactive}
                            onClick={() => handleClick(starValue)}
                            onMouseEnter={() => interactive && setHoverRating(starValue)}
                            onMouseLeave={() => interactive && setHoverRating(0)}
                            className={cn(
                                'transition-all duration-200',
                                interactive && 'cursor-pointer hover:scale-110',
                                !interactive && 'cursor-default'
                            )}
                        >
                            <Star
                                className={cn(
                                    sizeClasses[size],
                                    'transition-colors duration-200',
                                    isFilled
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : isPartiallyFilled
                                            ? 'fill-yellow-400/50 text-yellow-400'
                                            : 'fill-none text-gray-300 dark:text-gray-600'
                                )}
                            />
                        </button>
                    );
                })}
            </div>
            {showNumber && (
                <div className="flex items-center gap-1 text-sm">
                    <span className="font-semibold">{rating.toFixed(1)}</span>
                    {reviewCount !== undefined && (
                        <span className="text-muted-foreground">({reviewCount})</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default RatingDisplay;
