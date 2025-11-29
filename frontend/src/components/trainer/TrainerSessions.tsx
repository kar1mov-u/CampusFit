import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { sessionApi } from '../../api/session';
import { registrationApi } from '../../api/registration';
import { Session, Registration } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Calendar, ChevronLeft, ChevronRight, Users, Clock, Loader2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const TrainerSessions: React.FC = () => {
    const { user } = useAuth();
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [sessionRegistrations, setSessionRegistrations] = useState<Record<string, Registration[]>>({});
    const [loadingRegistrations, setLoadingRegistrations] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (user?.id) {
            loadSessions();
        }
    }, [currentWeekStart, user]);

    const loadSessions = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
            const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

            // Fetch sessions for each day
            // Note: In a real app, we should have a range endpoint. For now, parallel requests.
            const promises = weekDays.map(day =>
                sessionApi.listTrainerSessions(user.id, format(day, 'yyyy-MM-dd'))
            );

            const results = await Promise.all(promises);
            const allSessions = results.flatMap(r => r.data || []);
            setSessions(allSessions);
        } catch (err) {
            console.error('Failed to load sessions', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRegistrations = async (sessionId: string) => {
        if (sessionRegistrations[sessionId]) return; // Already loaded

        try {
            setLoadingRegistrations(prev => ({ ...prev, [sessionId]: true }));
            const response = await registrationApi.listSessionRegistrations(sessionId);
            setSessionRegistrations(prev => ({ ...prev, [sessionId]: response.data }));
        } catch (err) {
            console.error('Failed to load registrations', err);
        } finally {
            setLoadingRegistrations(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    const toggleSessionExpand = (sessionId: string) => {
        if (selectedSession === sessionId) {
            setSelectedSession(null);
        } else {
            setSelectedSession(sessionId);
            loadRegistrations(sessionId);
        }
    };

    const handlePreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

    const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    });

    if (loading && sessions.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
                <h2 className="text-lg font-semibold flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-primary" />
                    {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </h2>
                <div className="flex gap-2">
                    <button onClick={handlePreviousWeek} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-6">
                {weekDays.map(day => {
                    const daySessions = sessions.filter(s => isSameDay(new Date(s.date), day));
                    if (daySessions.length === 0) return null;

                    return (
                        <div key={day.toISOString()} className="space-y-3">
                            <h3 className="font-medium text-muted-foreground ml-1">
                                {format(day, 'EEEE, MMMM d')}
                            </h3>
                            <div className="grid gap-4">
                                {daySessions.map(session => (
                                    <motion.div
                                        key={session.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-card rounded-xl border border-border overflow-hidden"
                                    >
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleSessionExpand(session.id)}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center justify-center w-16 h-16 bg-primary/10 rounded-lg text-primary">
                                                    <Clock className="w-5 h-5 mb-1" />
                                                    <span className="text-xs font-bold">{session.start_time}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-lg">Training Session</span>
                                                        {session.is_canceled && (
                                                            <span className="px-2 py-0.5 bg-red-500/10 text-red-600 text-xs rounded-full border border-red-500/20">
                                                                Canceled
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                                                        <span className="flex items-center">
                                                            <Users className="w-4 h-4 mr-1" />
                                                            {session.registered_count || 0} / {session.capacity} Registered
                                                        </span>
                                                        {/* Facility info could be fetched if needed, but session has facility_id */}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-primary">
                                                <span className="text-sm font-medium mr-2">
                                                    {selectedSession === session.id ? 'Hide Details' : 'View Details'}
                                                </span>
                                                <ChevronRight className={cn("w-5 h-5 transition-transform", selectedSession === session.id && "rotate-90")} />
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {selectedSession === session.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-border bg-muted/30"
                                                >
                                                    <div className="p-4">
                                                        <h4 className="font-semibold mb-3 flex items-center">
                                                            <Users className="w-4 h-4 mr-2" />
                                                            Registered Users
                                                        </h4>

                                                        {loadingRegistrations[session.id] ? (
                                                            <div className="flex justify-center py-4">
                                                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                                            </div>
                                                        ) : sessionRegistrations[session.id]?.length > 0 ? (
                                                            <div className="grid gap-2">
                                                                {sessionRegistrations[session.id].map(reg => (
                                                                    <div key={reg.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                                                {reg.user?.first_name?.[0]}{reg.user?.last_name?.[0]}
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-medium text-sm">
                                                                                    {reg.user?.first_name} {reg.user?.last_name}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {reg.user?.email}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            Registered {format(new Date(reg.created_at), 'MMM d, HH:mm')}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                                No users registered yet.
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {sessions.length === 0 && !loading && (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No sessions scheduled</h3>
                        <p className="text-muted-foreground">
                            You don't have any sessions scheduled for this week.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerSessions;
