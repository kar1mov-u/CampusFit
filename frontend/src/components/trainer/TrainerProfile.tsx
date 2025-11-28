import React, { useState, useEffect } from 'react';
import { User, Edit2, Save, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { trainerApi } from '../../api/trainer';
import { useAuth } from '../../context/AuthContext';
import { Trainer, UpdateTrainerRequest } from '../../types';

const TrainerProfile: React.FC = () => {
    const { user } = useAuth();
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        bio: '',
        specialty: '',
    });

    useEffect(() => {
        if (user?.id) {
            loadTrainerProfile();
        }
    }, [user]);

    const loadTrainerProfile = async () => {
        try {
            setLoading(true);
            const response = await trainerApi.getTrainerProfile(user!.id);
            setTrainer(response.data);
            setFormData({
                bio: response.data.bio || '',
                specialty: response.data.specialty || '',
            });
        } catch (err: any) {
            console.error('Failed to load trainer profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.bio.trim() || !formData.specialty.trim()) {
            setError('Bio and specialty are required');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            await trainerApi.updateTrainerProfile(user!.id, formData);
            setSuccess(true);
            setIsEditing(false);
            await loadTrainerProfile();

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            bio: trainer?.bio || '',
            specialty: trainer?.specialty || '',
        });
        setIsEditing(false);
        setError(null);
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
                        <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Trainer Profile</h2>
                        <p className="text-sm text-muted-foreground">Manage your professional information</p>
                    </div>
                </div>

                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Success Message */}
            {success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-lg"
                >
                    Profile updated successfully!
                </motion.div>
            )}

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
                >
                    {error}
                </motion.div>
            )}

            {/* Profile Form */}
            <div className="glass-card p-6 space-y-6">
                {/* Specialty */}
                <div>
                    <label className="block text-sm font-medium mb-2">Specialty</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={formData.specialty}
                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                            placeholder="e.g., Strength Training, Yoga, CrossFit"
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    ) : (
                        <p className="text-lg">{trainer?.specialty || 'Not set'}</p>
                    )}
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    {isEditing ? (
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell us about your experience, certifications, and training philosophy..."
                            rows={6}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    ) : (
                        <p className="text-muted-foreground whitespace-pre-wrap">{trainer?.bio || 'No bio added yet'}</p>
                    )}
                    {isEditing && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {formData.bio.length} characters
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Info */}
            {trainer && (
                <div className="glass-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Profile Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Created</p>
                            <p className="font-medium">{new Date(trainer.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Last Updated</p>
                            <p className="font-medium">{new Date(trainer.updated_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerProfile;
