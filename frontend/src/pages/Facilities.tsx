import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { facilityApi } from '../api/facility';
import { Facility } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  MapPin,
  ArrowRight,
  Search,
  Dumbbell,
  Trophy,
  Activity
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const Facilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const data = await facilityApi.getAll();
      setFacilities(data.data);
    } catch (err: any) {
      setError('Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSportIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'football':
      case 'soccer':
        return <Activity className="w-12 h-12" />;
      case 'basketball':
      case 'tennis':
      case 'volleyball':
        return <Trophy className="w-12 h-12" />;
      case 'swimming':
      case 'pool':
        return <Activity className="w-12 h-12" />;
      default:
        return <Dumbbell className="w-12 h-12" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sport Facilities</h1>
          <p className="text-muted-foreground mt-1">
            Find and book your perfect training spot
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {filteredFacilities.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No facilities found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredFacilities.map((facility) => (
            <motion.div
              key={facility.id}
              variants={item}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/facility/${facility.id}`)}
              className="group bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="relative h-48 bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-500">
                {getSportIcon(facility.type)}
                <div className="absolute top-4 right-4">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    facility.is_active
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-red-500/10 text-red-600 border-red-500/20"
                  )}>
                    {facility.is_active ? 'Active' : 'Maintenance'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {facility.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {facility.description}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="capitalize">{facility.type} Court</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Capacity: {facility.capacity} people</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{facility.open_time} - {facility.close_time}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full flex items-center justify-center space-x-2 bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-secondary-foreground py-2.5 rounded-lg transition-all duration-300 font-medium">
                    <span>View Schedule</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

// Helper for class names
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default Facilities;
