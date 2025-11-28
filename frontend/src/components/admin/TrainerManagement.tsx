import React, { useState, useEffect } from 'react';
import { Users, Trash2, Loader2, Search, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../api/admin';
import { Trainer } from '../../types';

const TrainerManagement: React.FC = () => {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        try {
            setLoading(true);
            const response = await adminApi.listTrainers();
            setTrainers(response.data);
        } catch (err) {
            console.error('Failed to load trainers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTrainer = async (trainerId: string) => {
        if (!confirm('Are you sure you want to remove this trainer? This will revoke their trainer status.')) {
            return;
        }

        try {
            setDeletingId(trainerId);
            await adminApi.removeTrainer(trainerId);
            await loadTrainers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to remove trainer');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredTrainers = trainers.filter(trainer =>
        trainer.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl">
                        <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Trainer Management</h2>
                        <p className="text-sm text-muted-foreground">Manage trainer accounts and permissions</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search trainers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-64"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                    <p className="text-sm text-muted-foreground">Total Trainers</p>
                    <p className="text-2xl font-bold text-primary">{trainers.length}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-muted-foreground">Active Trainers</p>
                    <p className="text-2xl font-bold text-green-600">{trainers.length}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-muted-foreground">Specialties</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {new Set(trainers.map(t => t.specialty)).size}
                    </p>
                </div>
            </div>

            {/* Trainers List */}
            {filteredTrainers.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Trainers Found</h3>
                    <p className="text-muted-foreground">
                        {searchQuery ? 'Try adjusting your search query' : 'No trainers have been added yet'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {filteredTrainers.map((trainer) => (
                            <motion.div
                                key={trainer.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Award className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Trainer ID: {trainer.id.slice(0, 8)}...</h3>
                                                <p className="text-sm text-primary font-medium">{trainer.specialty}</p>
                                            </div>
                                        </div>

                                        <p className="text-muted-foreground mb-3 line-clamp-2">{trainer.bio}</p>

                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span>Created: {new Date(trainer.created_at).toLocaleDateString()}</span>
                                            <span>Updated: {new Date(trainer.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRemoveTrainer(trainer.id)}
                                        disabled={deletingId === trainer.id}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === trainer.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Removing...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Remove
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default TrainerManagement;
