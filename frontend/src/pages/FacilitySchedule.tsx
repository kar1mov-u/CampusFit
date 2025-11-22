import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilityService } from '../api/facility';
import { bookingService } from '../api/booking';
import { Facility, Booking } from '../types';
import { format, addDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const FacilitySchedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [bookingNote, setBookingNote] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, selectedDate]);

  const loadData = async () => {
    try {
      // Fetch facility data first
      const facilityData = await facilityService.getById(id!);
      setFacility(facilityData);

      // Try to fetch bookings, but don't fail if endpoint doesn't exist yet
      try {
        const bookingsData = await bookingService.getByFacility(id!, format(selectedDate, 'yyyy-MM-dd'));
        setBookings(bookingsData);
      } catch (bookingErr) {
        console.log('Bookings endpoint not available yet, using empty bookings');
        setBookings([]);
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

  const getSlotStatus = (hour: number): 'available' | 'booked' | 'my-booking' => {
    const booking = bookings.find((b) => {
      const startHour = parseInt(b.start_time.split(':')[0]);
      const endHour = parseInt(b.end_time.split(':')[0]);
      return hour >= startHour && hour < endHour && !b.is_canceled;
    });

    if (!booking) return 'available';
    if (booking.user_id === user?.id) return 'my-booking';
    return 'booked';
  };

  const isSlotSelected = (hour: number) => selectedSlots.includes(hour);

  const handleSlotClick = (hour: number) => {
    const status = getSlotStatus(hour);
    if (status !== 'available') return;

    if (isSlotSelected(hour)) {
      // Deselect
      setSelectedSlots(selectedSlots.filter(h => h !== hour));
    } else {
      // Only allow consecutive slots (max 2)
      if (selectedSlots.length === 0) {
        setSelectedSlots([hour]);
      } else if (selectedSlots.length === 1) {
        const existing = selectedSlots[0];
        if (Math.abs(hour - existing) === 1) {
          // Consecutive slot
          setSelectedSlots([Math.min(hour, existing), Math.max(hour, existing)]);
        } else {
          // Non-consecutive, replace
          setSelectedSlots([hour]);
        }
      } else {
        // Already have 2 slots, replace with new selection
        setSelectedSlots([hour]);
      }
    }
  };

  const openBookingModal = () => {
    if (selectedSlots.length > 0) {
      setShowBookingModal(true);
    }
  };

  const handleBooking = async () => {
    if (selectedSlots.length === 0 || !id) return;

    try {
      const sortedSlots = [...selectedSlots].sort((a, b) => a - b);
      const startHour = sortedSlots[0];
      const endHour = sortedSlots[sortedSlots.length - 1] + 1;

      await bookingService.create({
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
      alert('Booking created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create booking');
    }
  };

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      days.push(addDays(today, i));
    }
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Facility not found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700"
          >
            Go back to facilities
          </button>
        </div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center font-medium"
          >
            ← Back to facilities
          </button>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{facility.name}</h1>
                <p className="text-gray-600 text-lg mb-6">{facility.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-3 rounded-lg">
                      <span className="text-2xl">🏃</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-semibold capitalize">{facility.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-3 rounded-lg">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="font-semibold">{facility.capacity} people</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-3 rounded-lg">
                      <span className="text-2xl">🕐</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Opens</p>
                      <p className="font-semibold">{facility.open_time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-3 rounded-lg">
                      <span className="text-2xl">🕐</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Closes</p>
                      <p className="font-semibold">{facility.close_time}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Select a Date</h2>
          <div className="grid grid-cols-7 gap-3">
            {getNextDays().map((day) => {
              const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-lg'
                      : isToday
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="text-xs font-medium uppercase">{format(day, 'EEE')}</div>
                  <div className="text-2xl font-bold my-1">{format(day, 'd')}</div>
                  <div className="text-xs">{format(day, 'MMM')}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Time Slots
            </h2>
            <p className="text-gray-600 mt-1">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click on available slots to select. You can select 1 or 2 consecutive hours.
            </p>
          </div>
          
          {timeSlots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No time slots available</p>
              <p className="text-sm mt-2">This facility may be closed on this day</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {timeSlots.map((slot) => {
                const status = getSlotStatus(slot.hour);
                const selected = isSlotSelected(slot.hour);
                
                let colorClasses = '';
                let cursorClass = 'cursor-pointer';
                let statusIcon = '';
                
                if (selected) {
                  colorClasses = 'bg-yellow-100 border-yellow-400 text-yellow-900 ring-2 ring-yellow-400';
                  statusIcon = '📌 Selected';
                } else if (status === 'my-booking') {
                  colorClasses = 'bg-blue-50 text-blue-700 border-2 border-blue-300';
                  cursorClass = 'cursor-default';
                  statusIcon = '✓ Your Booking';
                } else if (status === 'booked') {
                  colorClasses = 'bg-red-50 text-red-700 border-2 border-red-200 opacity-60';
                  cursorClass = 'cursor-not-allowed';
                  statusIcon = '🔒 Booked';
                } else {
                  colorClasses = 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 shadow-sm hover:shadow-md';
                  statusIcon = '✓ Available';
                }

                return (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotClick(slot.hour)}
                    disabled={status !== 'available'}
                    className={`p-5 rounded-xl text-center font-semibold transition-all transform hover:scale-105 ${colorClasses} ${cursorClass}`}
                  >
                    <div className="text-xl font-bold">{slot.time}</div>
                    <div className="text-xs mt-2 font-medium uppercase tracking-wide">
                      {statusIcon}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedSlots.length > 0 && (
            <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    Selected: {selectedSlots.sort((a, b) => a - b).map(h => `${h}:00`).join(' - ')} 
                    {selectedSlots.length > 1 ? ` - ${Math.max(...selectedSlots) + 1}:00` : ` - ${selectedSlots[0] + 1}:00`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Duration: {selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedSlots([])}
                    className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    onClick={openBookingModal}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-8 text-sm bg-white rounded-lg py-4 px-6 shadow-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-50 border-2 border-green-200 rounded"></div>
            <span className="font-medium text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-50 border-2 border-blue-300 rounded"></div>
            <span className="font-medium text-gray-700">Your Booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-50 border-2 border-red-200 rounded"></div>
            <span className="font-medium text-gray-700">Booked by Others</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
            <span className="font-medium text-gray-700">Selected</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlots.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Confirm Your Booking</h3>
            <div className="space-y-4 mb-6 bg-gray-50 p-5 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="text-xs text-gray-500">Facility</p>
                  <p className="font-semibold text-gray-900">{facility?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold text-gray-900">{format(selectedDate, 'MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-semibold text-gray-900">
                    {Math.min(...selectedSlots).toString().padStart(2, '0')}:00 - {(Math.max(...selectedSlots) + 1).toString().padStart(2, '0')}:00
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900">{selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            
            {/* Note Input */}
            <div className="mb-6">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Add a note (optional)
              </label>
              <textarea
                id="note"
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder="E.g., Team practice, Basketball game, etc."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingNote('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitySchedule;
