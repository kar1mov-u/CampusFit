import React from 'react';
import { cn } from '../../lib/utils';

interface CreditScoreBadgeProps {
    score: number;
    className?: string;
}

const CreditScoreBadge: React.FC<CreditScoreBadgeProps> = ({ score, className }) => {
    let colorClass = 'bg-green-100 text-green-800 border-green-200';

    if (score < 50) {
        colorClass = 'bg-red-100 text-red-800 border-red-200';
    } else if (score < 80) {
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }

    return (
        <div className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
            colorClass,
            className
        )}>
            Credit Score: {score}
        </div>
    );
};

export default CreditScoreBadge;
