import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilityService } from '../api/facility';
import { bookingService } from '../api/booking';
import { Facility, Booking } from '../types';
import { format, addDays, startOfWeek } from 'date-fns';

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
      const [facilityData, bookingsData] = await Promise.all([
        facilityService.getById(id!),
        bookingService.getByFacility(id!, format(selectedDate, 'yyyy-MM-dd')),
      ]);
      setFacility(facilityData);
      setBookings(bookingsData);
    } catch (err) {
      console.error('Failed to load data', err);
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
      await bookingService.create({
        facility_id: id,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
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
    const start = startOfWeek(new Date());
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
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
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
          >
            ← Back to facilities
          </button>
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{facility.name}</h1>
            <p className="text-gray-600 mb-4">{facility.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span>{' '}
                <span className="capitalize">{facility.type}</span>
              </div>
              <div>
                <span className="font-medium">Capacity:</span> {facility.capacity} people
              </div>
              <div>
                <span className="font-medium">Hours:</span> {facility.open_time} - {facility.close_time}
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Select Date</h2>
          <div className="grid grid-cols-7 gap-2">
            {getNextDays().map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-lg font-bold">{format(day, 'd')}</div>
                <div className="text-xs">{format(day, 'MMM')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">
            Schedule for {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {timeSlots.map((slot) => {
              const booked = isSlotBooked(slot.hour);
              return (
                <button
                  key={slot.time}
                  onClick={() => handleSlotClick(slot.hour)}
                  disabled={booked}
                  className={`p-4 rounded-lg text-center font-medium transition-colors ${
                    booked
                      ? 'bg-red-100 text-red-800 cursor-not-allowed'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  <div className="text-lg">{slot.time}</div>
                  <div className="text-xs mt-1">{booked ? 'Booked' : 'Available'}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Booking</h3>
            <div className="space-y-3 mb-6">
              <p>
                <span className="font-medium">Facility:</span> {facility.name}
              </p>
              <p>
                <span className="font-medium">Date:</span> {format(selectedDate, 'MMMM d, yyyy')}
              </p>
              <p>
                <span className="font-medium">Time:</span>{' '}
                {new Date(selectedSlot.start).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })} - {new Date(selectedSlot.end).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedSlot(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
