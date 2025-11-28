import React, { useEffect, useState } from 'react';
import { userService } from '../../api/user';
import { facilityApi } from '../../api/facility';
import { adminApi } from '../../api/admin';
import { User, Booking, Facility } from '../../types';
import { format } from 'date-fns';
import { Search, ChevronLeft, ChevronRight, X, Calendar, Clock, MapPin, Award, Loader2 } from 'lucide-react';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [facilities, setFacilities] = useState<Record<string, string>>({});
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const LIMIT = 10; // Assuming backend default limit

  useEffect(() => {
    loadUsers();
    loadFacilities();
  }, [offset, keyword]);

  useEffect(() => {
    if (selectedUser) {
      loadUserBookings(selectedUser.id);
    } else {
      setUserBookings([]);
    }
  }, [selectedUser]);

  const loadFacilities = async () => {
    try {
      const response = await facilityApi.getAll();
      const facilMap: Record<string, string> = {};
      if (response.data) {
        response.data.forEach((f: Facility) => {
          facilMap[f.id] = f.name;
        });
      }
      setFacilities(facilMap);
    } catch (err) {
      console.error('Failed to load facilities', err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll(offset, keyword);
      if (data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBookings = async (userId: string) => {
    try {
      setLoadingBookings(true);
      // Fetching first page of bookings for the user details view
      const data = await userService.getBookings(userId, 0);
      setUserBookings(data);
    } catch (err) {
      console.error('Failed to load user bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.delete(id);
        loadUsers();
        if (selectedUser?.id === id) {
          setSelectedUser(null);
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0); // Reset to first page on search
    // keyword state is already updated via onChange, useEffect triggers loadUsers
  };

  const handlePromoteToTrainer = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to promote this user to trainer?')) {
      return;
    }

    try {
      setPromotingId(userId);
      await adminApi.promoteToTrainer(userId);
      await loadUsers(); // Reload to show updated role
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to promote user to trainer');
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900">Users Management</h2>

        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search users..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'trainer' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                          {user.role}
                        </span>
                        {user.role === 'trainer' && (
                          <Award className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(user.created_at), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {user.role !== 'trainer' && user.role !== 'admin' && (
                        <button
                          onClick={(e) => handlePromoteToTrainer(user.id, e)}
                          disabled={promotingId === user.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {promotingId === user.id ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Promoting...
                            </span>
                          ) : (
                            'Promote to Trainer'
                          )}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(user.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
          <div className="flex-1 flex justify-between sm:justify-end gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              disabled={offset === 0 || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + LIMIT)}
              disabled={!hasMore || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedUser(null)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        User Details
                      </h3>
                      <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Role</p>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Joined</p>
                        <p className="mt-1 text-sm text-gray-900">{format(new Date(selectedUser.created_at), 'PPP')}</p>
                      </div>
                    </div>

                    <h4 className="text-md font-medium text-gray-900 mb-3">Recent Bookings</h4>
                    {loadingBookings ? (
                      <div className="text-center py-4 text-sm text-gray-500">Loading bookings...</div>
                    ) : userBookings.length === 0 ? (
                      <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">No bookings found</div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {userBookings.map((booking) => (
                          <div key={booking.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2 text-sm font-medium text-gray-900">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{format(new Date(booking.date), 'MMM d, yyyy')}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${booking.is_canceled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {booking.is_canceled ? 'Canceled' : 'Confirmed'}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{booking.start_time} - {booking.end_time}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span title={booking.facility_id}>
                                  {facilities[booking.facility_id] || 'Unknown Facility'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
