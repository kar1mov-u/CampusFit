import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FacilitiesManagement from '../components/admin/FacilitiesManagement';
import UsersManagement from '../components/admin/UsersManagement';
import BookingsManagement from '../components/admin/BookingsManagement';
import TrainerManagement from '../components/admin/TrainerManagement';

type TabType = 'facilities' | 'users' | 'bookings' | 'trainers';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('facilities');
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Welcome, {user?.first_name} {user?.last_name}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('facilities')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'facilities'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Facilities
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'bookings'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('trainers')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'trainers'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Trainers
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'facilities' && <FacilitiesManagement />}
            {activeTab === 'users' && <UsersManagement />}
            {activeTab === 'bookings' && <BookingsManagement />}
            {activeTab === 'trainers' && <TrainerManagement />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
