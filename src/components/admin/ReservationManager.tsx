import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Clock, Calendar, Users, Phone, Mail, Trash2, Edit2, Save, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

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
    rejection_reason?: string;
    created_at: string;
}

const ReservationManager = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
    const [rejectingReservation, setRejectingReservation] = useState<Reservation | null>(null);
    const [deletingReservation, setDeletingReservation] = useState<Reservation | null>(null);

    useEffect(() => {
        loadReservations();
    }, []);

    const loadReservations = async () => {
        try {
            const res = await fetch(`/api/get-reservations.php?t=${Date.now()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setReservations(data);
            }
        } catch (e) {
            console.error("Failed to load reservations", e);
        } finally {
            setLoading(false);
        }
    };

    const saveReservations = async (updated: Reservation[]) => {
        setReservations(updated); // Optimistic UI update
        try {
            const res = await fetch('/api/save-reservations.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            const data = await res.json();
            if (!data.success) {
                console.error("Failed to save:", data.error);
                alert("Fehler beim Speichern: " + (data.error || "Unbekannter Fehler"));
                loadReservations(); // Rollback
            }
        } catch (e) {
            console.error("Failed to save reservations", e);
            loadReservations(); // Rollback
        }
    };

    const handleStatus = async (id: string, status: 'confirmed' | 'rejected', reason?: string) => {
        if (status === 'rejected' && !reason) {
            const res = reservations.find(r => r.id === id);
            if (res) setRejectingReservation(res);
            return;
        }

        const updated = reservations.map(r => r.id === id ? { ...r, status, rejection_reason: reason || '' } : r);
        saveReservations(updated);
        setRejectingReservation(null);
    };

    const handleDelete = (id: string) => {
        const res = reservations.find(r => r.id === id);
        if (res) setDeletingReservation(res);
    };

    const confirmDelete = () => {
        if (deletingReservation) {
            saveReservations(reservations.filter(r => r.id !== deletingReservation.id));
            setDeletingReservation(null);
        }
    };

    const handleEdit = (res: Reservation) => {
        setEditingReservation(res);
    };

    const handleUpdate = (updatedRes: Reservation) => {
        const updated = reservations.map(r => r.id === updatedRes.id ? updatedRes : r);
        saveReservations(updated);
        setEditingReservation(null);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Lade Reservierungen...</div>;

    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => r.date === today);
    const futureReservations = reservations
        .filter(r => r.date > today)
        .sort((a, b) => {
            // First sort by date
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            // Then sort by time
            return a.time.localeCompare(b.time);
        });

    return (
        <div className="space-y-12 pb-20">
            {/* Today's Section */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic border-l-4 border-green-500 pl-4">
                        HEUTE <span className="text-green-500 ml-2 animate-pulse">•</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {todayReservations.length > 0 ? todayReservations.map(res => (
                        <ReservationCard
                            key={res.id}
                            res={res}
                            onStatus={handleStatus}
                            onDelete={handleDelete}
                            onEdit={() => handleEdit(res)}
                        />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {futureReservations.length > 0 ? futureReservations.map(res => (
                        <ReservationCard
                            key={res.id}
                            res={res}
                            onStatus={handleStatus}
                            onDelete={handleDelete}
                            onEdit={() => handleEdit(res)}
                        />
                    )) : (
                        <p className="text-gray-600 italic">Keine weiteren Reservierungen.</p>
                    )}
                </div>
            </section>

            {/* Edit Modal */}
            {editingReservation && (
                <EditModal
                    reservation={editingReservation}
                    onClose={() => setEditingReservation(null)}
                    onSave={handleUpdate}
                    onDelete={handleDelete}
                />
            )}

            {/* Rejection Modal */}
            {rejectingReservation && (
                <RejectionModal
                    reservation={rejectingReservation}
                    onClose={() => setRejectingReservation(null)}
                    onConfirm={(reason) => handleStatus(rejectingReservation.id, 'rejected', reason)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingReservation && (
                <DeleteConfirmationModal
                    reservation={deletingReservation}
                    onClose={() => setDeletingReservation(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </div>
    );
};

const statusLabels: Record<string, string> = {
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
    rejected: 'Abgelehnt',
};

// Helper: Format time HH:mm:ss to HH:mm
const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
};

const ReservationCard = ({ res, onStatus, onDelete, onEdit }: {
    res: Reservation,
    onStatus: (id: string, s: any) => void,
    onDelete: (id: string) => void,
    onEdit: () => void
}) => (
    <div className={`h-full p-6 rounded-none border transition-all duration-300 flex flex-col ${res.status === 'pending' ? 'bg-white/[0.05] border-white/10' :
        res.status === 'confirmed' ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.05)]' :
            'bg-red-500/10 border-red-500/20 opacity-60'
        }`}>
        <div className="flex justify-between items-start gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <h3 className="text-xl font-bold text-white leading-none truncate" title={res.name}>{res.name}</h3>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 text-[11px] text-gray-300 font-bold shrink-0">
                    <Users size={12} className="text-secondary" />
                    {res.guests >= 11 ? '10+' : res.guests}
                </div>
            </div>
            <div className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-widest shrink-0 ${res.status === 'pending' ? 'bg-white/10 text-white' :
                res.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                }`}>
                {statusLabels[res.status]}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 text-[13px] text-gray-400">
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-secondary shrink-0" />
                {new Date(res.date).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                })}
            </div>
            <div className="flex items-center gap-2">
                <Clock size={14} className="text-secondary shrink-0" />
                {formatTime(res.time)} Uhr
            </div>
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                <Phone size={14} className="text-secondary shrink-0" />
                <a href={`tel:${res.phone}`} className="hover:text-white transition-colors truncate">{res.phone}</a>
            </div>
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                <Mail size={14} className="text-secondary shrink-0" />
                <a href={`mailto:${res.email}`} className="hover:text-white transition-colors truncate">{res.email}</a>
            </div>
        </div>

        {res.comment && (
            <div className="mb-6 p-3 rounded-none bg-black/40 text-[11px] text-gray-500 italic border-l border-secondary/30">
                "{res.comment}"
            </div>
        )}

        {res.status === 'rejected' && res.rejection_reason && (
            <div className="mb-6 p-3 rounded-none bg-red-500/5 text-[11px] text-red-400 border-l border-red-500/30">
                <span className="font-bold uppercase text-[9px] block mb-1">Grund der Ablehnung:</span>
                "{res.rejection_reason}"
            </div>
        )}

        <div className="flex gap-2 items-center mt-auto pt-4">
            <div className="flex-1 flex gap-2">
                {(res.status === 'pending' || res.status === 'rejected') && (
                    <button
                        onClick={() => onStatus(res.id, 'confirmed')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-900/30 hover:bg-green-600 border border-green-500/30 text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-none"
                    >
                        <Check size={12} /> Bestätigen
                    </button>
                )}
                {(res.status === 'pending' || res.status === 'confirmed') && (
                    <button
                        onClick={() => onStatus(res.id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-900/30 hover:bg-red-600 border border-red-500/30 text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-none"
                    >
                        <X size={12} /> Ablehnen
                    </button>
                )}
            </div>
            <button
                onClick={onEdit}
                className="p-2.5 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                title="Bearbeiten"
            >
                <Edit2 size={14} />
            </button>
        </div>
    </div>
);

const CustomDropdown = ({ options, value, onChange, placeholder }: { options: { value: string | number, label: string }[], value: string | number, onChange: (val: string | number) => void, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="bg-black/50 border border-white/10 rounded-none px-4 py-3 text-sm cursor-pointer hover:border-secondary/50 focus:border-secondary focus:bg-secondary/5 transition-colors flex items-center justify-between outline-none select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? "text-white" : "text-white/25"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-black border border-white/10 max-h-52 overflow-y-auto shadow-2xl">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`px-4 py-2 text-[11px] cursor-pointer transition-colors ${value === opt.value ? 'bg-secondary/20 text-secondary' : 'text-gray-300 hover:bg-secondary/10 hover:text-white'} ${opt.value === 11 ? 'border-t border-white/5' : ''}`}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CustomCalendar = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const calendarRef = useRef<HTMLDivElement>(null);

    const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderDays = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} />);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(currentYear, currentMonth, d);
            const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const isSelected = value === dateStr;
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            let cls = "py-1.5 text-[11px] text-center transition-all cursor-pointer ";
            if (isPast) cls += "text-gray-700 cursor-not-allowed";
            else if (isSelected) cls += "bg-secondary text-black font-bold";
            else if (isToday) cls += "border border-secondary text-secondary font-bold hover:bg-secondary/20";
            else if (isWeekend) cls += "text-secondary/80 hover:bg-secondary/10 font-medium";
            else cls += "text-gray-300 hover:bg-white/10";

            days.push(
                <div
                    key={dateStr}
                    className={cls}
                    onClick={() => {
                        if (!isPast) {
                            onChange(dateStr);
                            setIsOpen(false);
                        }
                    }}
                >
                    {d}
                </div>
            );
        }
        return days;
    };

    const displayDate = value ? (() => {
        const d = new Date(value + "T00:00:00");
        return `${d.getDate().toString().padStart(2, '0')}. ${months[d.getMonth()]} ${d.getFullYear()}`;
    })() : "Datum wählen ...";

    return (
        <div className="relative" ref={calendarRef}>
            <div
                className="bg-black/50 border border-white/10 rounded-none px-4 py-3 text-sm cursor-pointer hover:border-secondary/50 focus:border-secondary focus:bg-secondary/5 transition-colors flex items-center justify-between outline-none select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? "text-white" : "text-white/25"}>{displayDate}</span>
                <Calendar size={16} className="text-secondary" />
            </div>

            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-black border border-white/10 p-4 shadow-2xl select-none w-56">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={() => {
                                let newMonth = currentMonth - 1;
                                let newYear = currentYear;
                                if (newMonth < 0) { newMonth = 11; newYear--; }
                                setCurrentMonth(newMonth);
                                setCurrentYear(newYear);
                            }}
                            className="p-1 text-gray-500 hover:text-secondary transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-[10px] uppercase tracking-widest text-white font-bold">
                            {months[currentMonth]} {currentYear}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                let newMonth = currentMonth + 1;
                                let newYear = currentYear;
                                if (newMonth > 11) { newMonth = 0; newYear++; }
                                setCurrentMonth(newMonth);
                                setCurrentYear(newYear);
                            }}
                            className="p-1 text-gray-500 hover:text-secondary transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
                            <span key={day} className={`text-[8px] uppercase tracking-wider font-bold ${i >= 5 ? 'text-secondary/60' : 'text-gray-600'}`}>{day}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {renderDays()}
                    </div>
                </div>
            )}
        </div>
    );
};

const EditModal = ({ reservation, onClose, onSave, onDelete }: {
    reservation: Reservation,
    onClose: () => void,
    onSave: (r: Reservation) => void,
    onDelete: (id: string) => void
}) => {
    const [formData, setFormData] = useState<Reservation>({ ...reservation });

    const handleDelete = () => {
        onDelete(reservation.id);
        onClose();
    };

    // Generate guest options
    const guestOptions = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1} Person${i === 0 ? '' : 'en'}` }));
    guestOptions.push({ value: 11, label: 'Mehr als 10 (siehe Bemerkung)' });

    // Generate time options based on date
    const weekdayTimes = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];
    const weekendTimes = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", ...weekdayTimes];

    const getAvailableTimes = (dateStr: string) => {
        if (!dateStr) return [];
        const dayOfWeek = new Date(dateStr + "T00:00:00").getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        return isWeekend ? weekendTimes : weekdayTimes;
    };

    const timeOptions = getAvailableTimes(formData.date).map(t => ({ value: t, label: t + ' Uhr' }));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic">Bearbeiten</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="bg-black/50 border border-white/10 rounded-none w-full px-4 py-3 text-sm text-white focus:border-secondary outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Datum</label>
                        <CustomCalendar
                            value={formData.date}
                            onChange={(val) => {
                                setFormData({ ...formData, date: val, time: '' }); // Reset time when date changes
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Uhrzeit</label>
                        <CustomDropdown
                            options={timeOptions}
                            value={formData.time}
                            onChange={(val) => setFormData({ ...formData, time: val as string })}
                            placeholder={formData.date ? "Uhrzeit wählen" : "Zuerst Datum wählen"}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Personen</label>
                        <CustomDropdown
                            options={guestOptions}
                            value={formData.guests}
                            onChange={(val) => setFormData({ ...formData, guests: val as number })}
                            placeholder="Wählen ..."
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Telefon</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-black/50 border border-white/10 rounded-none w-full px-4 py-3 text-sm text-white focus:border-secondary outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="mt-8 sm:mt-10 flex gap-4">
                    <button
                        onClick={handleDelete}
                        className="p-3 text-red-500 hover:text-white hover:bg-red-500 bg-white/5 border border-white/10 transition-all rounded-none"
                        title="Reservierung löschen"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        className="flex-1 py-3 bg-secondary text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                        <Save size={14} /> Speichern
                    </button>
                </div>
            </div>
        </div>
    );
};

const RejectionModal = ({ reservation, onClose, onConfirm }: {
    reservation: Reservation,
    onClose: () => void,
    onConfirm: (reason: string) => void
}) => {
    const [reason, setReason] = useState('Leider sind wir zu diesem Zeitpunkt bereits ausgebucht.');

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-red-500/20 p-8 shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic border-l-4 border-red-500 pl-4">Ablehnen</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-gray-400 mb-6">
                    Bitte geben Sie einen Grund für die Ablehnung an. Dieser wird <span className="text-red-400 font-bold">per E-Mail</span> an <span className="text-white">{reservation.name}</span> gesendet.
                </p>

                <div className="mb-8">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-2">Grund der Ablehnung</label>
                    <textarea
                        autoFocus
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-none w-full px-4 py-2 text-sm text-white focus:border-red-500 outline-none transition-colors h-32 resize-none"
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => onConfirm(reason)}
                        className="w-full py-3 bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                    >
                        <X size={14} /> Definitiv Ablehnen
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmationModal = ({ reservation, onClose, onConfirm }: {
    reservation: Reservation,
    onClose: () => void,
    onConfirm: () => void
}) => {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-[#0a0a0a] border border-red-500/20 p-8 shadow-2xl animate-fade-in-up text-center">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 flex items-center justify-center rounded-none mx-auto ml-24">
                        <Trash2 size={24} className="text-red-500" />
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <h3 className="text-xl font-bold text-white uppercase tracking-tighter italic mb-2">Reservierung löschen?</h3>
                <p className="text-sm text-gray-400 mb-8 px-4">
                    Möchten Sie die Reservierung von <b className="text-white italic">{reservation.name}</b> wirklich unwiderruflich löschen?
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={onConfirm}
                        className="w-full py-3 bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                    >
                        Löschen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReservationManager;
