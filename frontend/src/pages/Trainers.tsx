import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainerApi } from '../api/trainer';
import { Trainer } from '../types';
import { motion } from 'framer-motion';
import { Users, MapPin, Star, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const Trainers: React.FC = () => {
    const navigate = useNavigate();
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        try {
            setLoading(true);
            const response = await trainerApi.listTrainers();
            setTrainers(response.data);
        } catch (err) {
            console.error('Failed to load trainers:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Expert Trainers</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Meet our certified professionals dedicated to helping you achieve your fitness goals.
                </p>
            </div>

            {trainers.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground">No trainers found</h3>
                    <p className="text-muted-foreground">
                        Check back later for our roster of expert trainers.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainers.map((trainer, index) => (
                        <motion.div
                            key={trainer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
                        >
                            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                {trainer.profile_picture_url ? (
                                    <img
                                        src={trainer.profile_picture_url}
                                        alt={`${trainer.user.first_name} ${trainer.user.last_name}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                                        <Users className="w-16 h-16 text-primary/40" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                        {trainer.user.first_name} {trainer.user.last_name}
                                    </h3>
                                    <p className="text-sm text-primary font-medium mt-1">
                                        {trainer.specialization}
                                    </p>
                                </div>

                                <p className="text-muted-foreground text-sm line-clamp-2">
                                    {trainer.bio || "No bio available."}
                                </p>

                                <div className="pt-4 flex items-center justify-between border-t border-border">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Star className="w-4 h-4 text-yellow-500 mr-1 fill-yellow-500" />
                                        <span className="font-medium text-foreground">4.9</span>
                                        <span className="mx-1">•</span>
                                        <span>120+ Sessions</span>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/trainers/${trainer.id}`)}
                                        className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Trainers;
