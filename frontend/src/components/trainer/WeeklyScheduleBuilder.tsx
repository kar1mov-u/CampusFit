import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityApi } from '../../api/facility';
import { trainerApi } from '../../api/trainer';
import { Facility, CreateScheduleRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ScheduleSlot {
    id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    facility_id: string;
    facility_name: string;
    capacity: number;
}

const WeeklyScheduleBuilder: React.FC = () => {
    const { user } = useAuth();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<CreateScheduleRequest>({
        facility_id: '',
        weekday: 1, // Monday
        start_time: '09:00',
        end_time: '10:00',
        capacity: 10,
    });

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [facilitiesRes, schedulesRes] = await Promise.all([
                facilityApi.getAll(),
                trainerApi.getWeeklySchedules(user!.id)
            ]);

            setFacilities(facilitiesRes.data);

            // Map backend schedules to UI format
            const mappedSchedules = schedulesRes.data.map((s: any) => {
                const facility = facilitiesRes.data.find(f => f.id === s.facility_id);
                return {
                    id: s.id,
                    weekday: s.weekday,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    facility_id: s.facility_id,
                    facility_name: facility?.name || 'Unknown Facility',
                    capacity: s.capacity
                };
            });
            setSchedules(mappedSchedules);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchedule = async () => {
        if (!formData.facility_id) {
            alert('Please select a facility');
            return;
        }

        try {
            setSubmitting(true);
            await trainerApi.createWeeklySchedule(formData);

            // Reload data to get the new schedule with ID
            await loadData();

            setShowAddForm(false);
            // Reset form
            setFormData({
                facility_id: '',
                weekday: 1,
                start_time: '09:00',
                end_time: '10:00',
                capacity: 10,
            });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create schedule');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveSchedule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        try {
            await trainerApi.deleteSchedule(id);
            setSchedules(schedules.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to delete schedule:', err);
            alert('Failed to delete schedule');
        }
    };

    const getSchedulesForDay = (day: number) => {
        return schedules.filter(s => s.weekday === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl">
                        <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Weekly Schedule</h2>
                        <p className="text-sm text-muted-foreground">Manage your recurring training sessions</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Schedule
                </button>
            </div>

            {/* Add Schedule Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-6 space-y-4"
                    >
                        <h3 className="text-lg font-semibold">Add New Schedule Slot</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Weekday */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Day of Week</label>
                                <select
                                    value={formData.weekday}
                                    onChange={(e) => setFormData({ ...formData, weekday: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {WEEKDAYS.map((day, index) => (
                                        <option key={index} value={index}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Facility */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Facility</label>
                                <select
                                    value={formData.facility_id}
                                    onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Select a facility</option>
                                    {facilities.map((facility) => (
                                        <option key={facility.id} value={facility.id}>
                                            {facility.name} ({facility.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Time */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Start Time</label>
                                <input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* End Time */}
                            <div>
                                <label className="block text-sm font-medium mb-2">End Time</label>
                                <input
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Capacity</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleAddSchedule}
                                disabled={submitting}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Add to Schedule
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Weekly Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {WEEKDAYS.map((day, index) => {
                    const daySchedules = getSchedulesForDay(index);

                    return (
                        <div key={index} className="glass-card p-4">
                            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                {day}
                            </h3>

                            {daySchedules.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">No sessions scheduled</p>
                            ) : (
                                <div className="space-y-2">
                                    {daySchedules.map((schedule) => (
                                        <motion.div
                                            key={schedule.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-background border border-border rounded-lg p-3 space-y-2"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <Clock className="w-4 h-4 text-primary" />
                                                        {schedule.start_time} - {schedule.end_time}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {schedule.facility_name}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                        <Users className="w-4 h-4" />
                                                        Capacity: {schedule.capacity}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveSchedule(schedule.id)}
                                                    className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            {schedules.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Schedule Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-primary">{schedules.length}</p>
                            <p className="text-sm text-muted-foreground">Total Sessions</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">
                                {new Set(schedules.map(s => s.weekday)).size}
                            </p>
                            <p className="text-sm text-muted-foreground">Active Days</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">
                                {new Set(schedules.map(s => s.facility_id)).size}
                            </p>
                            <p className="text-sm text-muted-foreground">Facilities</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">
                                {schedules.reduce((sum, s) => sum + s.capacity, 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Total Capacity</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyScheduleBuilder;
