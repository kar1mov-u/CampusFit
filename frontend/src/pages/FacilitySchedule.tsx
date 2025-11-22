import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilityService } from '../api/facility';
import { bookingService } from '../api/booking';
import { Facility, Booking } from '../types';
import { format, addDays } from 'date-fns';

const FacilitySchedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

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

  const isSlotBooked = (hour: number) => {
    return bookings.some((booking) => {
      const bookingStart = new Date(booking.start_time);
      const bookingHour = bookingStart.getHours();
      return bookingHour === hour && booking.status !== 'cancelled';
    });
  };

  const handleSlotClick = (hour: number) => {
    const startTime = new Date(selectedDate);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1);

    if (!isSlotBooked(hour)) {
      setSelectedSlot({
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      });
      setShowBookingModal(true);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !id) return;

    try {
      // Parse the ISO timestamps to extract date and time
      const startDate = new Date(selectedSlot.start);
      const endDate = new Date(selectedSlot.end);

      await bookingService.create({
        facility_id: id,
        date: format(startDate, 'yyyy-MM-dd'),
        start_time: format(startDate, 'HH:mm'),
        end_time: format(endDate, 'HH:mm'),
      });
      setShowBookingModal(false);
      setSelectedSlot(null);
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
          </div>
          
          {timeSlots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No time slots available</p>
              <p className="text-sm mt-2">This facility may be closed on this day</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {timeSlots.map((slot) => {
                const booked = isSlotBooked(slot.hour);
                return (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotClick(slot.hour)}
                    disabled={booked}
                    className={`p-5 rounded-xl text-center font-semibold transition-all transform hover:scale-105 ${
                      booked
                        ? 'bg-red-50 text-red-700 border-2 border-red-200 cursor-not-allowed opacity-60'
                        : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="text-xl font-bold">{slot.time}</div>
                    <div className="text-xs mt-2 font-medium uppercase tracking-wide">
                      {booked ? '🔒 Booked' : '✓ Available'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-8 text-sm bg-white rounded-lg py-4 px-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-50 border-2 border-green-200 rounded"></div>
            <span className="font-medium text-gray-700">Available to book</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-50 border-2 border-red-200 rounded"></div>
            <span className="font-medium text-gray-700">Already booked</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-900">Confirm Your Booking</h3>
            <div className="space-y-4 mb-8 bg-gray-50 p-5 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <p className="text-xs text-gray-500">Facility</p>
                  <p className="font-semibold text-gray-900">{facility.name}</p>
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
                    {new Date(selectedSlot.start).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })} - {new Date(selectedSlot.end).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedSlot(null);
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
