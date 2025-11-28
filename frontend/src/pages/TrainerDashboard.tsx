import React, { useState } from 'react';
import { User, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import TrainerProfile from '../components/trainer/TrainerProfile';
import WeeklyScheduleBuilder from '../components/trainer/WeeklyScheduleBuilder';

type TabType = 'profile' | 'schedule' | 'sessions';

const TrainerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('profile');

    const tabs = [
        { id: 'profile' as TabType, label: 'Profile', icon: User },
        { id: 'schedule' as TabType, label: 'Weekly Schedule', icon: Calendar },
        { id: 'sessions' as TabType, label: 'Sessions', icon: BarChart3 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary to-purple-600 rounded-xl">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Trainer Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Welcome back, {user?.first_name} {user?.last_name}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="glass-card p-2">
                <div className="flex gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'profile' && <TrainerProfile />}
                {activeTab === 'schedule' && <WeeklyScheduleBuilder />}
                {activeTab === 'sessions' && (
                    <div className="glass-card p-12 text-center">
                        <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Sessions Coming Soon</h3>
                        <p className="text-muted-foreground">
                            View and manage your upcoming training sessions here.
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default TrainerDashboard;
