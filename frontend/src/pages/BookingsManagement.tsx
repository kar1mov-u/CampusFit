import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/user';
import { facilityApi } from '../api/facility';
import { bookingApi } from '../api/booking';
import { Booking, Facility } from '../types';
import { Calendar, Clock, MapPin, AlertCircle, ChevronLeft, ChevronRight, X, CheckCircle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import UserSessions from '../components/user/UserSessions';

type BookingFilter = 'all' | 'upcoming' | 'past' | 'canceled';

const BookingsManagement: React.FC = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [facilities, setFacilities] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState<BookingFilter>('all');
    const [activeTab, setActiveTab] = useState<'bookings' | 'sessions'>('bookings');
    const LIMIT = 10;

    // Toast notification state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const init = async () => {
            if (!user) return;
            try {
                setLoading(true);
                // Fetch facilities first to have the map ready
                const facilResponse = await facilityApi.getAll();
                const facilMap: Record<string, string> = {};
                if (facilResponse.data) {
                    facilResponse.data.forEach((f: Facility) => {
                        facilMap[f.id] = f.name;
                    });
                }
                setFacilities(facilMap);

                await fetchBookings();
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load data. Please try again later.');
                setLoading(false);
            }
        };
        init();
    }, [user]);

    useEffect(() => {
        if (user && activeTab === 'bookings') fetchBookings();
    }, [offset, activeTab]);

    const fetchBookings = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await userService.getBookings(user.id, offset);
            if (data.length < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
            setBookings(data);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            setError('Failed to load bookings. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (hasMore) {
            setOffset(prev => prev + LIMIT);
        }
    };

    const handlePrevPage = () => {
        if (offset >= LIMIT) {
            setOffset(prev => prev - LIMIT);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (confirm('Are you sure you want to cancel this booking?')) {
            try {
                await bookingApi.cancel(bookingId);
                showSuccessToast('Booking canceled successfully');
                // Force reload data after cancellation
                await fetchBookings();
            } catch (err: any) {
                console.error('Cancel error:', err);
                const errorMsg = err.response?.data?.message || err.message || 'Failed to cancel booking';
                alert(`Failed to cancel booking: ${errorMsg}`);
            }
        }
    };

    const showSuccessToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Separate bookings into upcoming, past, and canceled
    const now = new Date();

    const upcomingBookings = bookings.filter(b => {
        if (b.is_canceled) return false;

        const bookingDate = new Date(b.date);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

        // If booking is in the future
        if (bookingDay > today) return true;

        // If booking is today, check if end time hasn't passed
        if (bookingDay.getTime() === today.getTime()) {
            const [endHours, endMinutes] = b.end_time.split(':').map(Number);
            const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHours, endMinutes);
            return endTime > now;
        }

        return false;
    });

    const pastBookings = bookings.filter(b => {
        if (b.is_canceled) return false;

        const bookingDate = new Date(b.date);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

        // If booking is in the past
        if (bookingDay < today) return true;

        // If booking is today, check if end time has passed
        if (bookingDay.getTime() === today.getTime()) {
            const [endHours, endMinutes] = b.end_time.split(':').map(Number);
            const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHours, endMinutes);
            return endTime <= now;
        }

        return false;
    });

    const canceledBookings = bookings.filter(b => b.is_canceled);

    // Filter bookings based on selected filter
    const getFilteredBookings = () => {
        switch (filter) {
            case 'upcoming':
                return upcomingBookings;
            case 'past':
                return pastBookings;
            case 'canceled':
                return canceledBookings;
            default:
                return bookings;
        }
    };

    const filteredBookings = getFilteredBookings();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        My Activity
                    </h1>
                </div>

                {/* Main Tabs */}
                <div className="flex p-1 bg-muted/50 rounded-xl w-full md:w-fit">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            activeTab === 'bookings'
                                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        Facility Bookings
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            activeTab === 'sessions'
                                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        Training Sessions
                    </button>
                </div>
            </div>

            {activeTab === 'bookings' && (
                <>
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
                            <button
                                onClick={() => setFilter('all')}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                    filter === 'all'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background"
                                )}
                            >
                                All ({bookings.length})
                            </button>
                            <button
                                onClick={() => setFilter('upcoming')}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                    filter === 'upcoming'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background"
                                )}
                            >
                                Upcoming ({upcomingBookings.length})
                            </button>
                            <button
                                onClick={() => setFilter('past')}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                    filter === 'past'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background"
                                )}
                            >
                                Past ({pastBookings.length})
                            </button>
                            <button
                                onClick={() => setFilter('canceled')}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                                    filter === 'canceled'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background"
                                )}
                            >
                                Canceled ({canceledBookings.length})
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {loading && bookings.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
                            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-foreground">No bookings found</h3>
                            <p className="text-muted-foreground">
                                {filter === 'all' && "You haven't made any bookings yet."}
                                {filter === 'upcoming' && "You don't have any upcoming bookings."}
                                {filter === 'past' && "You don't have any past bookings."}
                                {filter === 'canceled' && "You don't have any canceled bookings."}
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            key={filter}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {filteredBookings.map((booking) => {
                                const isUpcoming = upcomingBookings.includes(booking);
                                const isPast = pastBookings.includes(booking);
                                const isCanceled = booking.is_canceled;

                                return (
                                    <motion.div
                                        key={booking.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={cn(
                                            "bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-5 space-y-4",
                                            (isPast || isCanceled) && "opacity-70"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center space-x-2 text-primary font-medium">
                                                <Calendar className="w-4 h-4" />
                                                <span>{format(new Date(booking.date), 'MMMM d, yyyy')}</span>
                                            </div>
                                            <span
                                                className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-medium",
                                                    isUpcoming && "bg-green-500/10 text-green-600",
                                                    isPast && "bg-gray-500/10 text-gray-600",
                                                    isCanceled && "bg-destructive/10 text-destructive"
                                                )}
                                            >
                                                {isUpcoming && 'Confirmed'}
                                                {isPast && 'Completed'}
                                                {isCanceled && 'Canceled'}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2 text-muted-foreground">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {booking.start_time} - {booking.end_time}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-sm font-medium truncate" title={booking.facility_id}>
                                                    {facilities[booking.facility_id] || 'Unknown Facility'}
                                                </span>
                                            </div>
                                        </div>

                                        {booking.note && (
                                            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                                                "{booking.note}"
                                            </div>
                                        )}

                                        {booking.admin_note && (
                                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                                                <strong>Admin Note:</strong> {booking.admin_note}
                                            </div>
                                        )}

                                        {isUpcoming && (
                                            <button
                                                onClick={() => handleCancelBooking(booking.id)}
                                                className="w-full mt-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel Booking
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {/* Pagination Controls */}
                    <div className="flex justify-center items-center space-x-4 mt-8">
                        <button
                            onClick={handlePrevPage}
                            disabled={offset === 0 || loading}
                            className="p-2 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <span className="text-sm font-medium text-muted-foreground">
                            Page {Math.floor(offset / LIMIT) + 1}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={!hasMore || loading}
                            className="p-2 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </>
            )}

            {activeTab === 'sessions' && <UserSessions />}

            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
                    <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingsManagement;
