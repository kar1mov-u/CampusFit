import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import RatingDisplay from './RatingDisplay';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { reviewApi } from '../api/review';
import { Review } from '../types';

interface ReviewSectionProps {
    facilityId: string;
}

const REVIEWS_PER_PAGE = 10;

const ReviewSection: React.FC<ReviewSectionProps> = ({ facilityId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        loadReviews();
        loadRating();
    }, [facilityId]);

    const loadReviews = async (currentOffset = 0) => {
        try {
            if (currentOffset === 0) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const data = await reviewApi.getReviews(facilityId, currentOffset);

            if (currentOffset === 0) {
                setReviews(data.data);
            } else {
                setReviews((prev) => [...prev, ...data.data]);
            }

            // Check if there are more reviews
            setHasMore(data.data.length === REVIEWS_PER_PAGE);
            setOffset(currentOffset);
        } catch (err) {
            console.error('Failed to load reviews', err);
            if (currentOffset === 0) {
                setReviews([]);
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadRating = async () => {
        try {
            const data = await reviewApi.getRating(facilityId);
            setAverageRating(data.data.average_rating || 0);
        } catch (err) {
            console.error('Failed to load rating', err);
            setAverageRating(0);
        }
    };

    const handleReviewSubmitted = () => {
        // Reload reviews and rating after submission
        loadReviews(0);
        loadRating();
    };

    const handleReviewDeleted = () => {
        // Reload reviews and rating after deletion
        loadReviews(0);
        loadRating();
    };

    const handleLoadMore = () => {
        loadReviews(offset + REVIEWS_PER_PAGE);
    };

    return (
        <div className="space-y-8">
            {/* Section Header with Rating Summary */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6" />
                        Reviews & Ratings
                    </h2>
                </div>

                {/* Average Rating Display */}
                {reviews.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-6"
                    >
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="text-center md:text-left">
                                <div className="text-5xl font-bold text-primary mb-2">
                                    {averageRating.toFixed(1)}
                                </div>
                                <RatingDisplay rating={averageRating} size="lg" />
                                <p className="text-sm text-muted-foreground mt-2">
                                    Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="hidden md:block h-20 w-px bg-border" />
                            <div className="flex-1 text-center md:text-left">
                                <p className="text-muted-foreground">
                                    See what others are saying about this facility
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Review Form */}
            <ReviewForm facilityId={facilityId} onReviewSubmitted={handleReviewSubmitted} />

            {/* Reviews List */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">
                    All Reviews {reviews.length > 0 && `(${reviews.length})`}
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ReviewList
                        reviews={reviews}
                        onReviewDeleted={handleReviewDeleted}
                        onLoadMore={handleLoadMore}
                        hasMore={hasMore}
                        loading={loadingMore}
                    />
                )}
            </div>
        </div>
    );
};

export default ReviewSection;
