import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { facilityService } from '../api/facility';
import { Facility } from '../types';
import { useAuth } from '../context/AuthContext';

const Facilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const data = await facilityService.getAll();
      setFacilities(data);
    } catch (err: any) {
      setError('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  const getSportIcon = (type: string) => {
    switch (type) {
      case 'football':
        return '⚽';
      case 'basketball':
        return '🏀';
      case 'tennis':
        return '🎾';
      default:
        return '🏃';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sport Facilities</h1>
            <p className="mt-2 text-gray-600">Choose a facility to view and book time slots</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Admin Panel
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {facilities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No facilities available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((facility) => (
              <div
                key={facility.id}
                onClick={() => navigate(`/facility/${facility.id}`)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-8xl">{getSportIcon(facility.type)}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{facility.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        facility.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {facility.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{facility.description}</p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <span className="font-medium w-24">Type:</span>
                      <span className="capitalize">{facility.type}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-24">Capacity:</span>
                      <span>{facility.capacity} people</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-24">Hours:</span>
                      <span>
                        {facility.open_time} - {facility.close_time}
                      </span>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">
                    View Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Facilities;
