import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../api/booking';
import { facilityApi } from '../../api/facility';
import { userService } from '../../api/user';
import { Booking, Facility, User } from '../../types';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, Loader2, ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react';

const BookingsManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Date range state
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState(endOfWeek(new Date(), { weekStartsOn: 1 }));

  // Pagination state
  const [offset, setOffset] = useState(0);
  const LIMIT = 10; // Assuming backend limit, though not explicitly exposed in API

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [canceling, setCanceling] = useState(false);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [startDate, endDate, offset]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facilitiesData, usersData] = await Promise.all([
        facilityApi.getAll(),
        userService.getAll()
      ]);

      setFacilities(facilitiesData.data);

      const userMap: Record<string, string> = {};
      usersData.forEach((u: User) => {
        userMap[u.id] = `${u.first_name} ${u.last_name}`;
      });
      setUsers(userMap);

      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // Use the new getAll endpoint
      const bookingsData = await bookingApi.getAll(formattedStartDate, formattedEndDate, offset);

      // Sort by date and time
      const sortedBookings = bookingsData.data.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });

      setBookings(sortedBookings);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setAdminNote('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedBookingId(null);
    setAdminNote('');
  };

  const handleCancel = async () => {
    if (!selectedBookingId) return;

    try {
      setCanceling(true);
      await bookingApi.cancel(selectedBookingId, adminNote);
      closeCancelModal();
      showSuccessToast('Booking canceled successfully');
      // Force reload data after cancellation
      await loadData();
    } catch (err: any) {
      console.error('Cancel error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Cancel failed';
      alert(`Failed to cancel booking: ${errorMsg}`);
    } finally {
      setCanceling(false);
    }
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getFacilityName = (id: string) => {
    return facilities.find(f => f.id === id)?.name || id;
  };

  const getUserName = (id: string) => {
    return users[id] || id;
  };

  const getStatusColor = (isCanceled: boolean) => {
    if (isCanceled) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isCanceled: boolean) => {
    return isCanceled ? 'Cancelled' : 'Confirmed';
  };

  const handlePrevPage = () => {
    if (offset >= LIMIT) {
      setOffset(offset - LIMIT);
    }
  };

  const handleNextPage = () => {
    // Simple pagination check - if we got less than limit, we're at the end
    // But since we don't know exact total, we just allow next if we have items
    if (bookings.length > 0) {
      setOffset(offset + LIMIT);
    }
  };

  // Separate bookings into active and canceled
  const activeBookings = bookings.filter(b => !b.is_canceled);
  const canceledBookings = bookings.filter(b => b.is_canceled);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bookings Management</h2>
          <div className="text-sm text-gray-600 mt-1">
            Showing bookings from {format(startDate, 'MMM d')} to {format(endDate, 'MMM d, yyyy')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <span className="text-xs text-gray-500 font-medium">From:</span>
            <input
              type="date"
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                setStartDate(new Date(e.target.value));
                setOffset(0); // Reset pagination on filter change
              }}
              className="text-sm border-none focus:ring-0 text-gray-700 p-0"
            />
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <span className="text-xs text-gray-500 font-medium">To:</span>
            <input
              type="date"
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                setEndDate(new Date(e.target.value));
                setOffset(0); // Reset pagination on filter change
              }}
              className="text-sm border-none focus:ring-0 text-gray-700 p-0"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
          <p className="mt-2 text-gray-500">Loading bookings...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Bookings Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Bookings ({activeBookings.length})</h3>
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No active bookings found for this period.
                      </td>
                    </tr>
                  ) : (
                    activeBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(booking.date), 'MMM d')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {getFacilityName(booking.facility_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getUserName(booking.user_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {booking.note || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openCancelModal(booking.id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Canceled Bookings Section */}
          {canceledBookings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Canceled Bookings ({canceledBookings.length})</h3>
              <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {canceledBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 opacity-60">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(booking.date), 'MMM d')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {getFacilityName(booking.facility_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getUserName(booking.user_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {booking.note || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="px-6 py-4 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={offset === 0}
              className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {Math.floor(offset / LIMIT) + 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={bookings.length < LIMIT}
              className="flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
              <button
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this booking? You can optionally provide a reason below.
            </p>

            <div className="space-y-2">
              <label htmlFor="admin-note" className="block text-sm font-medium text-gray-700">
                Cancellation Reason (Optional)
              </label>
              <textarea
                id="admin-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g., Facility maintenance, Event cancelled..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeCancelModal}
                disabled={canceling}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {canceling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  'Cancel Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsManagement;
