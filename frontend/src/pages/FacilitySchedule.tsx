import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilityApi } from '../api/facility';
import { bookingApi } from '../api/booking';
import { sessionApi } from '../api/session';
import { Facility, Booking, Session } from '../types';
import { format, addDays, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  ArrowLeft,
  Check,
  X,
  Info,
  Loader2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import ReviewSection from '../components/ReviewSection';

const FacilitySchedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [bookingNote, setBookingNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, currentWeekStart]);

  const loadData = async () => {
    try {
      setLoading(true);
      const facilityData = await facilityApi.getById(id!);
      setFacility(facilityData.data);

      // Fetch bookings for the entire week
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

      try {
        // Fetch bookings and sessions for each day of the week
        const allBookingsPromises = weekDays.map(day =>
          bookingApi.getByFacility(id!, format(day, 'yyyy-MM-dd'))
        );
        const allSessionsPromises = weekDays.map(day =>
          sessionApi.listFacilitySessions(id!, format(day, 'yyyy-MM-dd'))
        );

        const [allBookingsResults, allSessionsResults] = await Promise.all([
          Promise.all(allBookingsPromises),
          Promise.all(allSessionsPromises)
        ]);

        const allBookings = allBookingsResults.flatMap(result => result.data);
        const allSessions = allSessionsResults.flatMap(result => result.data || []); // Handle potential null data

        setBookings(allBookings);
        setSessions(allSessions);
      } catch (bookingErr) {
        console.log('Bookings/Sessions endpoint error', bookingErr);
        setBookings([]);
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to load facility data', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (): Array<{ time: string; hour: number }> => {
    const slots: Array<{ time: string; hour: number }> = [];
    if (!facility) return slots;

    const [openHour] = facility.open_time.split(':').map(Number);
    const [closeHour] = facility.close_time.split(':').map(Number);

    for (let hour = openHour; hour < closeHour; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
      });
    }
    return slots;
  };

  const getSlotStatus = (hour: number, date: Date): 'available' | 'booked' | 'my-booking' | 'session' => {
    // Check for sessions first
    const session = sessions.find((s) => {
      const startHour = parseInt(s.start_time.split(':')[0]);
      const endHour = parseInt(s.end_time.split(':')[0]);
      return hour >= startHour && hour < endHour && !s.is_canceled && isSameDay(new Date(s.date), date);
    });
    if (session) return 'session';

    const booking = bookings.find((b) => {
      const startHour = parseInt(b.start_time.split(':')[0]);
      const endHour = parseInt(b.end_time.split(':')[0]);
      return hour >= startHour && hour < endHour && !b.is_canceled && isSameDay(new Date(b.date), date);
    });

    if (!booking) return 'available';
    if (booking.user_id === user?.id) return 'my-booking';
    return 'booked';
  };

  const isSlotSelected = (hour: number, date: Date) => {
    return selectedSlots.some(slot => slot === hour) && isSameDay(date, selectedDate);
  };

  const handleSlotClick = (hour: number, date: Date) => {
    // Prevent booking on past dates and times
    const now = new Date();
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);

    if (slotTime < now) return;

    // Set the selected date when clicking a slot
    setSelectedDate(date);

    const status = getSlotStatus(hour, date);
    if (status !== 'available') return;

    if (isSlotSelected(hour, date)) {
      setSelectedSlots(selectedSlots.filter(h => h !== hour));
    } else {
      if (selectedSlots.length === 0) {
        setSelectedSlots([hour]);
      } else if (selectedSlots.length === 1) {
        const existing = selectedSlots[0];
        if (Math.abs(hour - existing) === 1) {
          setSelectedSlots([Math.min(hour, existing), Math.max(hour, existing)]);
        } else {
          setSelectedSlots([hour]);
        }
      } else {
        setSelectedSlots([hour]);
      }
    }
  };

  const getWeekDays = () => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    setSelectedSlots([]);
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    setSelectedSlots([]);
  };

  const handleBooking = async () => {
    if (selectedSlots.length === 0 || !id) return;

    try {
      setSubmitting(true);
      const sortedSlots = [...selectedSlots].sort((a, b) => a - b);
      const startHour = sortedSlots[0];
      const endHour = sortedSlots[sortedSlots.length - 1] + 1;

      // Final check for past time
      const now = new Date();
      const bookingTime = new Date(selectedDate);
      bookingTime.setHours(startHour, 0, 0, 0);

      if (bookingTime < now) {
        alert("Cannot book past time slots.");
        return;
      }

      await bookingApi.create({
        facility_id: id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: `${startHour.toString().padStart(2, '0')}:00`,
        end_time: `${endHour.toString().padStart(2, '0')}:00`,
        note: bookingNote,
      });

      setShowBookingModal(false);
      setSelectedSlots([]);
      setBookingNote('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !facility) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">Facility not found</h2>
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:underline flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to facilities
        </button>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground flex items-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to facilities
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{facility.name}</h1>
            <p className="text-muted-foreground mt-1 text-lg">{facility.description}</p>
          </div>
          <div className="flex gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium border",
              facility.is_active
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-red-500/10 text-red-600 border-red-500/20"
            )}>
              {facility.is_active ? 'Active' : 'Maintenance'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground border-y border-border py-4">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="capitalize">{facility.type} Court</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span>Capacity: {facility.capacity}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span>{facility.open_time} - {facility.close_time}</span>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            Week of {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-lg border border-input hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg border border-input hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
          {getWeekDays().map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex-shrink-0 min-w-[80px] p-3 rounded-xl border transition-all duration-200",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                    : "bg-card hover:border-primary/50 hover:bg-muted",
                  isToday && !isSelected && "border-primary/50",
                  isPast && !isSelected && "opacity-70"
                )}
              >
                <div className="text-xs font-medium uppercase opacity-80">{format(day, 'EEE')}</div>
                <div className="text-xl font-bold my-1">{format(day, 'd')}</div>
                <div className="text-xs opacity-80">{format(day, 'MMM')}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots for Selected Day */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Available Slots - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <div className="flex gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary border border-border"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/50"></div>
              <span>Your Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500/20 border border-purple-500/50"></div>
              <span>Training Session</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {timeSlots.map((slot) => {
            const status = getSlotStatus(slot.hour, selectedDate);
            const selected = isSlotSelected(slot.hour, selectedDate);
            const now = new Date();
            const slotTime = new Date(selectedDate);
            slotTime.setHours(slot.hour, 0, 0, 0);
            const isPastSlot = slotTime < now;

            // Only show available slots, user's own bookings, and sessions
            if (status === 'booked') {
              return null;
            }

            return (
              <motion.button
                key={slot.time}
                whileHover={status === 'available' && !isPastSlot ? { scale: 1.02 } : {}}
                whileTap={status === 'available' && !isPastSlot ? { scale: 0.98 } : {}}
                onClick={() => {
                  if (status === 'session') {
                    alert('Registration for sessions coming soon!');
                    return;
                  }
                  handleSlotClick(slot.hour, selectedDate);
                }}
                disabled={(status !== 'available' && status !== 'session') || isPastSlot}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200 relative overflow-hidden",
                  status === 'available' && !selected && !isPastSlot && "bg-card hover:border-primary/50 cursor-pointer",
                  status === 'available' && !selected && isPastSlot && "bg-card opacity-50 cursor-not-allowed",
                  selected && "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20",
                  status === 'my-booking' && "bg-blue-500/10 text-blue-600 border-blue-500/20 cursor-default",
                  status === 'session' && "bg-purple-500/10 text-purple-600 border-purple-500/20 cursor-pointer hover:bg-purple-500/20"
                )}
              >
                <div className="text-lg font-bold">{slot.time}</div>
                <div className="text-xs mt-1 font-medium flex items-center justify-center gap-1">
                  {selected && <Check className="w-3 h-3" />}
                  {status === 'my-booking' && <Users className="w-3 h-3" />}
                  {status === 'session' && <Users className="w-3 h-3" />}
                  {status === 'available' && !selected && 'Available'}
                  {selected && 'Selected'}
                  {status === 'my-booking' && 'Your Booking'}
                  {status === 'session' && 'Training Session'}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Booking Action Bar */}
      <AnimatePresence>
        {selectedSlots.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border z-40"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="hidden md:block">
                <p className="font-semibold">
                  {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, 'MMMM d, yyyy')} • {Math.min(...selectedSlots)}:00 - {Math.max(...selectedSlots) + 1}:00
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setSelectedSlots([])}
                  className="px-6 py-2.5 rounded-lg border border-input hover:bg-muted transition-colors font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="flex-1 md:flex-none px-8 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg shadow-primary/25"
                >
                  Book Selected Slots
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold">Confirm Booking</h3>
                  <p className="text-muted-foreground mt-1">Please review your booking details</p>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Facility</span>
                    <span className="font-medium">{facility.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(selectedDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {Math.min(...selectedSlots)}:00 - {Math.max(...selectedSlots) + 1}:00
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Add a note (optional)</label>
                  <textarea
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    placeholder="E.g., Team practice..."
                    className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-input hover:bg-muted transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reviews Section */}
      <div className="border-t border-border pt-12 mt-12">
        <ReviewSection facilityId={id!} />
      </div>
    </div>
  );
};

export default FacilitySchedule;
