import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { penaltyApi } from '../../api/penalties';

interface PenalizeUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    sessionId?: string;
    bookingId?: string;
    onSuccess: () => void;
}

const PenalizeUserModal: React.FC<PenalizeUserModalProps> = ({
    isOpen,
    onClose,
    userId,
    userName,
    sessionId,
    bookingId,
    onSuccess,
}) => {
    const [amount, setAmount] = useState<number>(10);
    const [reason, setReason] = useState('');
    const [penaltyType, setPenaltyType] = useState<string>('other');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

            const response = await penaltyApi.createPenalty({
                user_id: userId,
                session_id: sessionId || ZERO_UUID,
                booking_id: bookingId || ZERO_UUID,
                reason,
                points: amount,
                penalty_type: penaltyType,
            });

            if (response.success) {
                onSuccess();
                onClose();
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to create penalty');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-lg shadow-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-destructive">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Penalize User</h2>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                    You are about to penalize <span className="font-bold text-foreground">{userName}</span>.
                    This will deduct points from their credit score.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Penalty Amount (Points)</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={amount}
                            onChange={(e) => setAmount(parseInt(e.target.value))}
                            className="w-full p-2 rounded-md border border-input bg-background"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Penalty Type</label>
                        <select
                            value={penaltyType}
                            onChange={(e) => setPenaltyType(e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background"
                            required
                        >
                            <option value="late">Late</option>
                            <option value="absence">Absence</option>
                            <option value="damage">Damage</option>
                            <option value="behavior">Behavior</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background min-h-[80px]"
                            placeholder="e.g., Late cancellation, No-show"
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md hover:bg-muted transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Apply Penalty'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PenalizeUserModal;
