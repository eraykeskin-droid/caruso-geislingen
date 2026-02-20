import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Calendar, Users, Phone, Mail, Trash2 } from 'lucide-react';

interface Reservation {
    id: string;
    name: string;
    email: string;
    phone: string;
    guests: number;
    date: string;
    time: string;
    comment: string;
    status: 'pending' | 'confirmed' | 'rejected';
    created_at: string;
}

const ReservationManager = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        // Mocking fetch for now
        const mockRes: Reservation[] = [
            {
                id: 'C4012',
                name: 'Max Mustermann',
                email: 'max@example.com',
                phone: '01761234567',
                guests: 4,
                date: new Date().toISOString().split('T')[0],
                time: '19:30',
                comment: 'Fensterplatz bitte',
                status: 'pending',
                created_at: new Date().toISOString()
            }
        ];
        setReservations(mockRes);
        setLoading(false);
    };

    const handleStatus = async (id: string, status: 'confirmed' | 'rejected') => {
        // Update local state for immediate feedback
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));

        // API call would go here
        console.log(`Update ${id} to ${status}`);
    };

    const deleteOld = () => {
        // Logic to clear old reservations (> 2 days)
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Lade Reservierungen...</div>;

    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => r.date === today);
    const futureReservations = reservations.filter(r => r.date > today);

    return (
        <div className="p-6 space-y-12">
            {/* Today's Section */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic border-l-4 border-red-500 pl-4">
                        HEUTE <span className="text-red-500 ml-2 animate-pulse">•</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {todayReservations.length > 0 ? todayReservations.map(res => (
                        <ReservationCard key={res.id} res={res} onStatus={handleStatus} />
                    )) : (
                        <p className="text-gray-600 italic">Keine Reservierungen für heute.</p>
                    )}
                </div>
            </section>

            {/* Future Section */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic border-l-4 border-blue-500 pl-4">
                        Nächste Termine
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {futureReservations.length > 0 ? futureReservations.map(res => (
                        <ReservationCard key={res.id} res={res} onStatus={handleStatus} />
                    )) : (
                        <p className="text-gray-600 italic">Keine weiteren Reservierungen.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

const ReservationCard = ({ res, onStatus }: { res: Reservation, onStatus: (id: string, s: any) => void }) => (
    <div className={`p-6 rounded-xl border transition-all duration-300 ${res.status === 'pending' ? 'bg-white/[0.05] border-white/10' :
            res.status === 'confirmed' ? 'bg-green-500/10 border-green-500/20' :
                'bg-red-500/10 border-red-500/20 opacity-60'
        }`}>
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">{res.name}</h3>
                <span className="text-xs font-mono text-secondary uppercase tracking-widest">{res.id}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${res.status === 'pending' ? 'bg-white/10 text-white' :
                    res.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                }`}>
                {res.status}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-secondary" />
                {res.date}
            </div>
            <div className="flex items-center gap-2">
                <Clock size={16} className="text-secondary" />
                {res.time} Uhr
            </div>
            <div className="flex items-center gap-2">
                <Users size={16} className="text-secondary" />
                {res.guests} Personen
            </div>
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                <Phone size={16} className="text-secondary" />
                {res.phone}
            </div>
        </div>

        {res.comment && (
            <div className="mb-8 p-3 rounded bg-black/40 text-xs text-gray-500 italic border-l border-secondary/30">
                "{res.comment}"
            </div>
        )}

        {res.status === 'pending' && (
            <div className="flex gap-4">
                <button
                    onClick={() => onStatus(res.id, 'confirmed')}
                    className="flex-grow flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-widest transition-colors rounded"
                >
                    <Check size={14} /> Bestätigen
                </button>
                <button
                    onClick={() => onStatus(res.id, 'rejected')}
                    className="flex-grow flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-widest transition-colors rounded"
                >
                    <X size={14} /> Ablehnen
                </button>
            </div>
        )}
    </div>
);

export default ReservationManager;
