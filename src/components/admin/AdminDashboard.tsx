import React, { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';
import MenuManager from './MenuManager';
import ReservationManager from './ReservationManager';
import WebsiteManager from './WebsiteManager';
import { useAuth } from './AdminAuth';

const AdminDashboard = () => {
    const { role, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'menu' | 'reservations' | 'website'>('reservations');

    return (
        <>
            <nav className="border-b border-white/5 bg-black sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/images/caruso-logo-white.svg" alt="Logo" className="h-8" />
                        <span className="text-xs uppercase tracking-widest text-secondary font-bold border-l border-white/10 pl-4 hidden md:block">Management</span>
                    </div>
                    <div className="flex items-center gap-6">
                        {role === 'admin' && (
                            <button
                                onClick={() => setActiveTab('website')}
                                className={`transition-colors flex items-center gap-2 ${activeTab === 'website' ? 'text-secondary' : 'text-gray-500 hover:text-white'}`}
                                title="Webseite konfigurieren"
                            >
                                <Settings size={18} />
                                <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold hidden sm:block">Webseite</span>
                            </button>
                        )}
                        <button
                            onClick={logout}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                            title="Abmelden"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8 w-full">
                <div className="mb-12">
                    <h1 className="text-3xl md:text-5xl uppercase tracking-tighter mb-4 text-white">
                        Dashboard
                    </h1>
                    <p className="text-gray-500">
                        Zentralverwaltung für {role === 'admin' ? 'Getränke, Reservierungen und Webseite' : 'Reservierungen'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-white/10 mb-8">
                    <button
                        onClick={() => setActiveTab('reservations')}
                        className={`pb-4 text-[10px] sm:text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'reservations'
                            ? 'text-secondary border-b-2 border-secondary'
                            : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        Reservierungen
                    </button>
                    {role === 'admin' && (
                        <>
                            <button
                                onClick={() => setActiveTab('menu')}
                                className={`pb-4 text-[10px] sm:text-xs uppercase tracking-widest font-bold transition-all ${activeTab === 'menu'
                                    ? 'text-secondary border-b-2 border-secondary'
                                    : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                Getränkekarte
                            </button>
                        </>
                    )}
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
        </>
    );
};

export default AdminDashboard;
