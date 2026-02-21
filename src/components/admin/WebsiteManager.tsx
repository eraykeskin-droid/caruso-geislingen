import React, { useState, useEffect } from 'react';
import { Clock, Image, Trash2, Edit2, Plus, Save, X, MapPin, Phone, Mail, AtSign } from 'lucide-react';

interface DayHours {
    name: string;
    hours: string;
}

interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    span: string;
}

interface ContactInfo {
    name: string;
    street: string;
    city: string;
    phone: string;
    email: string;
    instagram: string;
}

const defaultContact: ContactInfo = {
    name: 'Café Caruso',
    street: 'Hauptstraße 36',
    city: '73312 Geislingen an der Steige',
    phone: '07331 9467928',
    email: 'info@cafe-caruso.de',
    instagram: 'cafecaruso_',
};

const defaultDays: DayHours[] = [
    { name: "Montag", hours: "18:00 - 00:00 Uhr" },
    { name: "Dienstag", hours: "18:00 - 00:00 Uhr" },
    { name: "Mittwoch", hours: "18:00 - 00:00 Uhr" },
    { name: "Donnerstag", hours: "18:00 - 00:00 Uhr" },
    { name: "Freitag", hours: "18:00 - 03:00 Uhr" },
    { name: "Samstag", hours: "14:00 - 03:00 Uhr" },
    { name: "Sonntag", hours: "14:00 - 00:00 Uhr" },
];

const defaultImages: GalleryImage[] = [
    { id: "img-1", src: "/images/gallery-06.webp", alt: "Caruso Bar mit Premium-Spirituosen", span: "col-span-2" },
    { id: "img-2", src: "/images/gallery-04.webp", alt: "Premium Shisha mit Cocktail", span: "" },
    { id: "img-3", src: "/images/gallery-01.webp", alt: "Gemütliche Lounge-Ecke", span: "" },
    { id: "img-4", src: "/images/gallery-03.webp", alt: "Speisen, Cocktails und Pizza", span: "col-span-2" },
    { id: "img-5", src: "/images/gallery-05.webp", alt: "Handgefertigter Cocktail", span: "" },
    { id: "img-6", src: "/images/gallery-02.webp", alt: "Chesterfield Lounge-Bereich", span: "" },
    { id: "img-7", src: "/images/gallery-07.webp", alt: "Tropischer Cocktail mit Pizza", span: "" },
];

const WebsiteManager = () => {
    const [days, setDays] = useState<DayHours[]>(defaultDays);
    const [images, setImages] = useState<GalleryImage[]>(defaultImages);
    const [contact, setContact] = useState<ContactInfo>(defaultContact);
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [editingImage, setEditingImage] = useState<string | null>(null);
    const [editingContact, setEditingContact] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const savedDays = localStorage.getItem('caruso_opening_hours');
        if (savedDays) setDays(JSON.parse(savedDays));

        const savedImages = localStorage.getItem('caruso_gallery_images');
        if (savedImages) setImages(JSON.parse(savedImages));

        const savedContact = localStorage.getItem('caruso_contact_info');
        if (savedContact) setContact(JSON.parse(savedContact));
    }, []);

    const saveDays = (updated: DayHours[]) => {
        setDays(updated);
        localStorage.setItem('caruso_opening_hours', JSON.stringify(updated));
        flashSave();
    };

    const saveImages = (updated: GalleryImage[]) => {
        setImages(updated);
        localStorage.setItem('caruso_gallery_images', JSON.stringify(updated));
        flashSave();
    };

    const flashSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 600);
    };

    const updateDay = (index: number, hours: string) => {
        const updated = [...days];
        updated[index] = { ...updated[index], hours };
        saveDays(updated);
        setEditingDay(null);
    };

    const updateImageAlt = (id: string, alt: string) => {
        const updated = images.map(img => img.id === id ? { ...img, alt } : img);
        saveImages(updated);
        setEditingImage(null);
    };

    const toggleImageSpan = (id: string) => {
        const updated = images.map(img =>
            img.id === id ? { ...img, span: img.span === "col-span-2" ? "" : "col-span-2" } : img
        );
        saveImages(updated);
    };

    const deleteImage = (id: string) => {
        if (confirm('Bild wirklich aus der Galerie entfernen?')) {
            saveImages(images.filter(img => img.id !== id));
        }
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                const alt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                const newImage: GalleryImage = {
                    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    src: dataUrl,
                    alt,
                    span: '',
                };
                setImages(prev => {
                    const updated = [...prev, newImage];
                    localStorage.setItem('caruso_gallery_images', JSON.stringify(updated));
                    return updated;
                });
                flashSave();
            };
            reader.readAsDataURL(file);
        });

        // Reset input so same file can be re-uploaded
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="p-6 relative space-y-12">
            {saving && (
                <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest rounded-none shadow-lg animate-fade-in border border-black/10">
                    <div className="w-2 h-2 bg-black rounded-none animate-ping text-[8px]"></div>
                    Gespeichert
                </div>
            )}

            {/* Opening Hours */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest border-l-4 border-secondary pl-4 flex items-center gap-3">
                        <Clock size={18} className="text-secondary" />
                        Öffnungszeiten
                    </h2>
                </div>

                <div className="max-w-lg space-y-1">
                    {days.map((day, index) => (
                        <div
                            key={day.name}
                            className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 group hover:border-secondary/20 transition-all"
                        >
                            <span className="text-xs uppercase tracking-widest text-white font-bold w-32">
                                {day.name}
                            </span>

                            {editingDay === index ? (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                                        updateDay(index, input.value);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        defaultValue={day.hours}
                                        autoFocus
                                        className="bg-black border border-white/10 rounded-none px-3 py-1 text-white text-xs outline-none focus:border-secondary w-44"
                                    />
                                    <button type="submit" className="text-green-400 hover:text-green-300">
                                        <Save size={14} />
                                    </button>
                                    <button type="button" onClick={() => setEditingDay(null)} className="text-gray-500 hover:text-white">
                                        <X size={14} />
                                    </button>
                                </form>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400">{day.hours}</span>
                                    <button
                                        onClick={() => setEditingDay(index)}
                                        className="p-1 text-gray-600 hover:text-secondary transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Contact Info */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest border-l-4 border-secondary pl-4 flex items-center gap-3">
                        <MapPin size={18} className="text-secondary" />
                        Kontakt & Adresse
                    </h2>
                    {!editingContact && (
                        <button
                            onClick={() => setEditingContact(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:border-secondary/30 hover:text-secondary transition-all rounded-none"
                        >
                            <Edit2 size={14} /> Bearbeiten
                        </button>
                    )}
                </div>

                {editingContact ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const updated: ContactInfo = {
                                name: (form.querySelector('[name="cname"]') as HTMLInputElement).value,
                                street: (form.querySelector('[name="street"]') as HTMLInputElement).value,
                                city: (form.querySelector('[name="city"]') as HTMLInputElement).value,
                                phone: (form.querySelector('[name="phone"]') as HTMLInputElement).value,
                                email: (form.querySelector('[name="email"]') as HTMLInputElement).value,
                                instagram: (form.querySelector('[name="instagram"]') as HTMLInputElement).value,
                            };
                            setContact(updated);
                            localStorage.setItem('caruso_contact_info', JSON.stringify(updated));
                            flashSave();
                            setEditingContact(false);
                        }}
                        className="max-w-lg space-y-3"
                    >
                        {[
                            { name: 'cname', label: 'Name', value: contact.name, icon: <MapPin size={14} className="text-secondary" /> },
                            { name: 'street', label: 'Straße', value: contact.street, icon: <MapPin size={14} className="text-secondary" /> },
                            { name: 'city', label: 'Stadt / PLZ', value: contact.city, icon: <MapPin size={14} className="text-secondary" /> },
                            { name: 'phone', label: 'Telefon', value: contact.phone, icon: <Phone size={14} className="text-secondary" /> },
                            { name: 'email', label: 'E-Mail', value: contact.email, icon: <Mail size={14} className="text-secondary" /> },
                            { name: 'instagram', label: 'Instagram', value: contact.instagram, icon: <AtSign size={14} className="text-secondary" /> },
                        ].map((field) => (
                            <div key={field.name} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5">
                                {field.icon}
                                <div className="flex-1">
                                    <label className="text-[9px] uppercase tracking-widest text-gray-600 font-bold block mb-1">{field.label}</label>
                                    <input
                                        name={field.name}
                                        type="text"
                                        defaultValue={field.value}
                                        className="w-full bg-black border border-white/10 rounded-none px-3 py-1.5 text-white text-xs outline-none focus:border-secondary"
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
                                <Save size={14} /> Speichern
                            </button>
                            <button type="button" onClick={() => setEditingContact(false)} className="px-6 py-2 bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors">
                                Abbrechen
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="max-w-lg space-y-1">
                        {[
                            { label: 'Name', value: contact.name, icon: <MapPin size={14} className="text-secondary" /> },
                            { label: 'Straße', value: contact.street, icon: <MapPin size={14} className="text-secondary" /> },
                            { label: 'Stadt', value: contact.city, icon: <MapPin size={14} className="text-secondary" /> },
                            { label: 'Telefon', value: contact.phone, icon: <Phone size={14} className="text-secondary" /> },
                            { label: 'E-Mail', value: contact.email, icon: <Mail size={14} className="text-secondary" /> },
                            { label: 'Instagram', value: `@${contact.instagram}`, icon: <AtSign size={14} className="text-secondary" /> },
                        ].map((field) => (
                            <div key={field.label} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5">
                                {field.icon}
                                <span className="text-xs text-gray-500 uppercase tracking-widest w-20 shrink-0">{field.label}</span>
                                <span className="text-xs text-white">{field.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Gallery */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest border-l-4 border-secondary pl-4 flex items-center gap-3">
                        <Image size={18} className="text-secondary" />
                        Bildergalerie
                    </h2>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors rounded-none shadow-lg"
                        >
                            <Plus size={14} /> Bild hochladen
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className={`relative group border border-white/5 hover:border-secondary/20 transition-all ${img.span}`}
                        >
                            <img
                                src={img.src}
                                alt={img.alt}
                                className="w-full h-40 object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23111" width="100" height="100"/><text x="50%" y="50%" fill="%23333" text-anchor="middle" dy=".3em" font-size="12">Bild fehlt</text></svg>';
                                }}
                            />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingImage(img.id)}
                                        className="p-2 bg-white/10 text-white hover:bg-secondary hover:text-black transition-all"
                                        title="Alt-Text bearbeiten"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => toggleImageSpan(img.id)}
                                        className={`p-2 text-white transition-all ${img.span ? 'bg-secondary/30 hover:bg-secondary hover:text-black' : 'bg-white/10 hover:bg-white/20'}`}
                                        title={img.span ? "Normal (1 Spalte)" : "Breit (2 Spalten)"}
                                    >
                                        <span className="text-[10px] font-bold">{img.span ? "2x" : "1x"}</span>
                                    </button>
                                    <button
                                        onClick={() => deleteImage(img.id)}
                                        className="p-2 bg-white/10 text-white hover:bg-red-500 transition-all"
                                        title="Bild löschen"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Alt-Text Edit */}
                            {editingImage === img.id && (
                                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 z-10">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                                            updateImageAlt(img.id, input.value);
                                        }}
                                        className="w-full space-y-3"
                                    >
                                        <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Alt-Text</label>
                                        <input
                                            type="text"
                                            defaultValue={img.alt}
                                            autoFocus
                                            className="w-full bg-black border border-white/10 rounded-none px-3 py-2 text-white text-xs outline-none focus:border-secondary"
                                        />
                                        <div className="flex gap-2">
                                            <button type="submit" className="flex-1 py-1.5 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
                                                Speichern
                                            </button>
                                            <button type="button" onClick={() => setEditingImage(null)} className="flex-1 py-1.5 bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors">
                                                Abbrechen
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Info Bar */}
                            <div className="p-2 bg-black/60">
                                <p className="text-[9px] text-gray-400 truncate">{img.alt}</p>
                                <p className="text-[8px] text-gray-600 font-mono truncate">{img.src}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default WebsiteManager;
