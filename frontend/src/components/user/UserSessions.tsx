import React, { useState, useEffect } from 'react';
import { registrationApi } from '../../api/registration';
import { facilityApi } from '../../api/facility';
import { trainerApi } from '../../api/trainer';
import { Registration } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Loader2, X, CheckCircle, AlertCircle, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const UserSessions: React.FC = () => {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [facilities, setFacilities] = useState<Record<string, string>>({});
    const [trainers, setTrainers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        try {
            setLoading(true);

            // Load registrations
            const regResponse = await registrationApi.listUserRegistrations(user.id);
            setRegistrations(regResponse.data || []);

            // Load facilities
            const facilityResponse = await facilityApi.getAll();
            const facilityMap: Record<string, string> = {};
            if (facilityResponse.data) {
                facilityResponse.data.forEach((f: any) => {
                    facilityMap[f.id] = f.name;
                });
            }
            setFacilities(facilityMap);

            // Load trainers
            const trainerResponse = await trainerApi.listTrainers();
            const trainerMap: Record<string, string> = {};
            if (trainerResponse.data) {
                trainerResponse.data.forEach((t: any) => {
                    trainerMap[t.id] = `${t.user.first_name} ${t.user.last_name}`;
                });
            }
            setTrainers(trainerMap);

        } catch (err) {
            console.error('Failed to load registrations', err);
            setError('Failed to load sessions.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRegistration = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this registration?')) return;
        try {
            await registrationApi.cancel(id);
            loadData();
        } catch (err) {
            alert('Failed to cancel registration');
        }
    };

    if (loading && registrations.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {registrations.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No sessions found</h3>
                    <p className="text-muted-foreground">
                        You haven't registered for any training sessions yet.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {registrations.map((reg) => (
                        <motion.div
                            key={reg.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                                "bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-5 space-y-4",
                                reg.is_canceled && "opacity-70"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2 text-primary font-medium">
                                    <Calendar className="w-4 h-4" />
                                    <span>Registered on {format(new Date(reg.created_at), 'MMM d, yyyy')}</span>
                                </div>
                                <span
                                    className={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium",
                                        !reg.is_canceled ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                                    )}
                                >
                                    {!reg.is_canceled ? 'Confirmed' : 'Canceled'}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {reg.session ? (
                                    <>
                                        <div className="flex items-center space-x-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>{format(new Date(reg.session.date), 'MMMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span>{reg.session.start_time} - {reg.session.end_time}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm">
                                                {facilities[reg.session.facility_id] || 'Loading...'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-muted-foreground">
                                            <User className="w-4 h-4" />
                                            <span className="text-sm font-medium text-primary">
                                                {trainers[reg.session.trainer_id] || 'Loading...'}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center space-x-2 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span>Session ID: {reg.session_id.slice(0, 8)}...</span>
                                    </div>
                                )}
                            </div>

                            {!reg.is_canceled && (
                                <button
                                    onClick={() => handleCancelRegistration(reg.id)}
                                    className="w-full mt-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel Registration
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserSessions;
