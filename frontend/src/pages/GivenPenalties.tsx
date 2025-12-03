import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { penaltyApi, Penalty } from '../api/penalties';
import { format } from 'date-fns';
import { AlertTriangle, Trash2 } from 'lucide-react';

const GivenPenalties: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPenalties = async () => {
        if (!user?.id) return;
        try {
            const response = await penaltyApi.getGivenPenalties(user.id);
            if (response.success) {
                setPenalties(response.data || []);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to fetch given penalties');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPenalties();
    }, [user?.id]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this penalty? Points will be refunded to the user.')) {
            return;
        }

        try {
            const response = await penaltyApi.deletePenalty(id);
            if (response.success) {
                // Refresh list
                fetchPenalties();
                // Refresh user data (credit score)
                await refreshUser();
            } else {
                alert(response.message || 'Failed to delete penalty');
            }
        } catch (err) {
            alert('Failed to delete penalty');
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading penalties...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Given Penalties</h1>
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">
                        Total Given: {penalties.length}
                    </span>
                </div>
            </div>

            {penalties.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-lg border border-border">
                    <p className="text-muted-foreground">You haven't given any penalties yet.</p>
                </div>
            ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Context</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {penalties.map((penalty) => {
                                const isSession = penalty.session_id && penalty.session_id !== '00000000-0000-0000-0000-000000000000';
                                const isBooking = penalty.booking_id && penalty.booking_id !== '00000000-0000-0000-0000-000000000000';

                                return (
                                    <tr key={penalty.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {penalty.user_name || 'Unknown User'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {format(new Date(penalty.created_at), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 bg-muted rounded-md text-xs font-medium capitalize">
                                                {penalty.penalty_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {penalty.reason}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {isSession && (
                                                <div className="flex flex-col">
                                                    <span className="flex items-center font-medium">
                                                        <span className="mr-1">📚</span>
                                                        <span>Training Session</span>
                                                    </span>
                                                    {penalty.facility_name && (
                                                        <span className="text-xs text-muted-foreground ml-5">
                                                            at {penalty.facility_name}
                                                        </span>
                                                    )}
                                                    {penalty.session_date && (
                                                        <span className="text-xs text-muted-foreground ml-5">
                                                            on {format(new Date(penalty.session_date), 'MMM d, HH:mm')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {isBooking && (
                                                <div className="flex flex-col">
                                                    <span className="flex items-center font-medium">
                                                        <span className="mr-1">📅</span>
                                                        <span>Facility Booking</span>
                                                    </span>
                                                    {penalty.facility_name && (
                                                        <span className="text-xs text-muted-foreground ml-5">
                                                            at {penalty.facility_name}
                                                        </span>
                                                    )}
                                                    {penalty.booking_date && (
                                                        <span className="text-xs text-muted-foreground ml-5">
                                                            on {format(new Date(penalty.booking_date), 'MMM d, HH:mm')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {!isSession && !isBooking && <span>General</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                                            -{penalty.points}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(penalty.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Delete Penalty"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GivenPenalties;
