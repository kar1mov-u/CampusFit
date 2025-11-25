import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import RatingDisplay from './RatingDisplay';
import { reviewApi } from '../api/review';

interface ReviewFormProps {
    facilityId: string;
    onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ facilityId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        if (comment.trim().length < 3) {
            setError('Comment must be at least 3 characters');
            return;
        }

        try {
            setSubmitting(true);
            await reviewApi.createReview(facilityId, {
                rating,
                comment: comment.trim(),
            });

            // Reset form
            setRating(0);
            setComment('');
            onReviewSubmitted();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 space-y-4"
        >
            <h3 className="text-lg font-semibold">Write a Review</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Your Rating</label>
                    <RatingDisplay
                        rating={rating}
                        interactive
                        onRatingChange={setRating}
                        size="lg"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Your Comment</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this facility..."
                        className="w-full min-h-[100px] p-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground">
                        Minimum 3 characters ({comment.length}/3)
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Submit Review
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default ReviewForm;
