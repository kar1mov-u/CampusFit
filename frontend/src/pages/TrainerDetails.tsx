import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trainerApi } from '../api/trainer';
import { sessionApi } from '../api/session';
import { registrationApi } from '../api/registration';
import { Trainer, Session } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MapPin, Star, ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight, Check, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const TrainerDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [registering, setRegistering] = useState<string | null>(null);
    const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set());

    const loadTrainer = async () => {
        try {
            const response = await trainerApi.getTrainerProfile(id!);
            setTrainer(response.data);
        } catch (err) {
            console.error('Failed to load trainer:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadSessions = async () => {
        try {
            const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
            const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

            const promises = weekDays.map(day =>
                sessionApi.listTrainerSessions(id!, format(day, 'yyyy-MM-dd'))
            );

            const results = await Promise.all(promises);
            const allSessions = results.flatMap(res => res.data || []);
            setSessions(allSessions);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        }
    };

    const loadUserRegistrations = async () => {
        if (!user) return;
        try {
            const response = await registrationApi.listUserRegistrations(user.id);
            const regSet = new Set(response.data.map((r: any) => r.session_id));
            setUserRegistrations(regSet);
        } catch (err) {
            console.error('Failed to load user registrations', err);
        }
    };

    const handleRegister = async (sessionId: string) => {
        if (!user) {
            alert('Please login to register');
            return;
        }

        try {
            setRegistering(sessionId);
            await registrationApi.create({ session_id: sessionId });
            alert('Successfully registered!');
            loadSessions(); // Reload to update capacity/status if needed
            loadUserRegistrations(); // Reload registrations
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to register');
        } finally {
            setRegistering(null);
        }
    };

    useEffect(() => {
        if (user) {
            loadUserRegistrations();
        }
    }, [user]);

    useEffect(() => {
        if (id) {
            loadTrainer();
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadSessions();
        }
    }, [id, currentWeekStart]);

    const getWeekDays = () => {
        const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
    };

    const getSessionsForDate = (date: Date) => {
        return sessions.filter(s => isSameDay(new Date(s.date), date)).sort((a, b) => a.start_time.localeCompare(b.start_time));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!trainer) {
        return <div>Trainer not found</div>;
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Profile */}
            <div className="relative bg-card rounded-3xl border border-border overflow-hidden">
                <div className="h-48 bg-gradient-to-r from-primary/20 to-purple-500/20" />
                <div className="px-8 pb-8">
                    <div className="relative -mt-20 mb-6 flex flex-col md:flex-row items-start md:items-end gap-6">
                        <div className="w-40 h-40 rounded-2xl border-4 border-background bg-muted overflow-hidden shadow-xl">
                            {trainer.profile_picture_url ? (
                                <img
                                    src={trainer.profile_picture_url}
                                    alt={`${trainer.user.first_name}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-secondary">
                                    <Users className="w-16 h-16 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <h1 className="text-4xl font-bold">{trainer.user.first_name} {trainer.user.last_name}</h1>
                            <p className="text-xl text-primary font-medium">{trainer.specialization}</p>

                        </div>
                        <button
                            onClick={() => navigate('/trainers')}
                            className="absolute top-6 right-0 md:static px-4 py-2 rounded-lg border border-input hover:bg-muted transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Trainers
                        </button>
                    </div>

                    <div className="max-w-3xl">
                        <h3 className="text-lg font-semibold mb-2">About</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {trainer.bio || "No bio available."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Schedule Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        Training Schedule
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                            className="p-2 rounded-lg border border-input hover:bg-muted transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                            className="p-2 rounded-lg border border-input hover:bg-muted transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Day Selector */}
                <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar">
                    {getWeekDays().map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={cn(
                                    "flex-shrink-0 min-w-[100px] p-4 rounded-xl border transition-all duration-200",
                                    isSelected
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                                        : "bg-card hover:border-primary/50 hover:bg-muted",
                                    isToday && !isSelected && "border-primary/50"
                                )}
                            >
                                <div className="text-sm font-medium uppercase opacity-80 mb-1">{format(day, 'EEE')}</div>
                                <div className="text-2xl font-bold">{format(day, 'd')}</div>
                            </button>
                        );
                    })}
                </div>

                {/* Sessions List */}
                <div className="grid gap-4">
                    <h3 className="text-lg font-semibold text-muted-foreground">
                        Sessions for {format(selectedDate, 'EEEE, MMMM d')}
                    </h3>

                    {getSessionsForDate(selectedDate).length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                            <p className="text-muted-foreground">No sessions scheduled for this day.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getSessionsForDate(selectedDate).map((session) => {
                                const spotsLeft = session.capacity - (session.registered_count || 0);
                                const isRegistered = userRegistrations.has(session.id);
                                return (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-medium border",
                                                spotsLeft > 0 ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                                            )}>
                                                {spotsLeft} spots left
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-6">
                                            <div className="text-2xl font-bold">
                                                {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                                            </div>
                                            <p className="text-muted-foreground text-sm">
                                                Training Session
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleRegister(session.id)}
                                            disabled={registering === session.id || spotsLeft <= 0 || isRegistered}
                                            className={cn(
                                                "w-full py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                                                isRegistered
                                                    ? "bg-muted text-muted-foreground border border-border"
                                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                                            )}
                                        >
                                            {registering === session.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : isRegistered ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Registered
                                                </>
                                            ) : (
                                                <>
                                                    {spotsLeft > 0 ? 'Register Now' : 'Full'}
                                                    {spotsLeft > 0 && <ArrowRight className="w-4 h-4" />}
                                                </>
                                            )}
                                        </button>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrainerDetails;
