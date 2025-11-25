import React, { useState } from 'react';
import { Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import RatingDisplay from './RatingDisplay';
import { Review } from '../types';
import { reviewApi } from '../api/review';
import { useAuth } from '../context/AuthContext';

interface ReviewListProps {
    reviews: Review[];
    onReviewDeleted: () => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    loading?: boolean;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const ReviewList: React.FC<ReviewListProps> = ({
    reviews,
    onReviewDeleted,
    onLoadMore,
    hasMore = false,
    loading = false,
}) => {
    const { user } = useAuth();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            setDeletingId(reviewId);
            await reviewApi.deleteReview(reviewId);
            onReviewDeleted();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete review');
        } finally {
            setDeletingId(null);
        }
    };

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No reviews yet</h3>
                <p className="text-muted-foreground mt-1">Be the first to review this facility!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
            >
                <AnimatePresence mode="popLayout">
                    {reviews.map((review) => (
                        <motion.div
                            key={review.id}
                            variants={item}
                            layout
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border rounded-xl p-6 space-y-3"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <RatingDisplay rating={review.rating} size="sm" />
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed">{review.comment}</p>
                                </div>

                                {user?.id === review.user_id && (
                                    <button
                                        onClick={() => handleDelete(review.id)}
                                        disabled={deletingId === review.id}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                                        title="Delete review"
                                    >
                                        {deletingId === review.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {hasMore && (
                <button
                    onClick={onLoadMore}
                    disabled={loading}
                    className="w-full py-3 border border-input rounded-lg hover:bg-muted transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        'Load More Reviews'
                    )}
                </button>
            )}
        </div>
    );
};

export default ReviewList;
