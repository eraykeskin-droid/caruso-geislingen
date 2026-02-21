import React, { useState } from 'react';
import MenuManager from './MenuManager';
import ReservationManager from './ReservationManager';
import WebsiteManager from './WebsiteManager';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'menu' | 'reservations' | 'website'>('reservations');

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 w-full">
            <div className="mb-12">
                <h1 className="text-3xl md:text-5xl uppercase tracking-tighter mb-4 text-white">
                    Dashboard
                </h1>
                <p className="text-gray-500">
                    Zentralverwaltung für Getränke, Reservierungen und Webseite
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-white/10 mb-8">
                <button
                    onClick={() => setActiveTab('reservations')}
                    className={`pb-4 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'reservations'
                        ? 'text-secondary border-b-2 border-secondary'
                        : 'text-gray-500 hover:text-white'
                        }`}
                >
                    Reservierungen
                </button>
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`pb-4 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'menu'
                        ? 'text-secondary border-b-2 border-secondary'
                        : 'text-gray-500 hover:text-white'
                        }`}
                >
                    Getränkekarte
                </button>
                <button
                    onClick={() => setActiveTab('website')}
                    className={`pb-4 text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'website'
                        ? 'text-secondary border-b-2 border-secondary'
                        : 'text-gray-500 hover:text-white'
                        }`}
                >
                    Webseite
                </button>
            </div>

            {/* Content Area */}
            <div className="transition-all duration-300">
                {activeTab === 'menu' && (
                    <div className="animate-fade-in">
                        <MenuManager />
                    </div>
                )}
                {activeTab === 'reservations' && (
                    <div className="animate-fade-in">
                        <ReservationManager />
                    </div>
                )}
                {activeTab === 'website' && (
                    <div className="animate-fade-in">
                        <WebsiteManager />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
