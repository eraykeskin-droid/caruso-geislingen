import React, { useState, useEffect } from 'react';
import { Clock, Image, Trash2, Edit2, Plus, Save, X, MapPin, Phone, Mail, AtSign, GripVertical, AlertCircle } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DayHours {
    id?: number;
    name: string;
    hours: string;
}

interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    description: string;
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
    name: '[NAME]',
    street: '[STREET]',
    city: '[CITY]',
    phone: '[PHONE_NUMBER]',
    email: '[EMAIL_ADDRESS]',
    instagram: '[INSTAGRAM_USERNAME]',
};

const defaultDays: DayHours[] = [
    { name: "Montag", hours: "[OPENING_HOURS]" },
    { name: "Dienstag", hours: "[OPENING_HOURS]" },
    { name: "Mittwoch", hours: "[OPENING_HOURS]" },
    { name: "Donnerstag", hours: "[OPENING_HOURS]" },
    { name: "Freitag", hours: "[OPENING_HOURS]" },
    { name: "Samstag", hours: "[OPENING_HOURS]" },
    { name: "Sonntag", hours: "[OPENING_HOURS]" },
];

const defaultImages: GalleryImage[] = [
    { id: "img-1", src: "/images/gallery/gallery-06.webp", alt: "Caruso Bar mit Premium-Spirituosen", description: "", span: "col-span-2" },
    { id: "img-2", src: "/images/gallery/gallery-04.webp", alt: "Premium Shisha mit Cocktail", description: "", span: "" },
    { id: "img-3", src: "/images/gallery/gallery-01.webp", alt: "Gemütliche Lounge-Ecke", description: "", span: "" },
    { id: "img-4", src: "/images/gallery/gallery-03.webp", alt: "Speisen, Cocktails und Pizza", description: "", span: "col-span-2" },
    { id: "img-5", src: "/images/gallery/gallery-05.webp", alt: "Handgefertigter Cocktail", description: "", span: "" },
    { id: "img-6", src: "/images/gallery/gallery-02.webp", alt: "Chesterfield Lounge-Bereich", description: "", span: "" },
    { id: "img-7", src: "/images/gallery/gallery-07.webp", alt: "Tropischer Cocktail mit Pizza", description: "", span: "" },
];

// Sortable Image Item Component
interface SortableImageProps {
    img: GalleryImage;
    onEdit: (id: string) => void;
    onToggleSpan: (id: string) => void;
    onDelete: (id: string) => void;
    isEditing: boolean;
    onEditMetadata: (id: string, alt: string, description: string) => void;
    onCancelEdit: () => void;
}

const SortableGalleryImage = ({ img, onEdit, onToggleSpan, onDelete, isEditing, onEditMetadata, onCancelEdit }: SortableImageProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: img.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group border border-white/5 hover:border-secondary/20 transition-all ${img.span} bg-black`}
        >
            <div className="relative overflow-hidden aspect-video md:aspect-auto md:h-40">
                <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23111" width="100" height="100"/><text x="50%" y="50%" fill="%23333" text-anchor="middle" dy=".3em" font-size="12">Bild fehlt</text></svg>';
                    }}
                />

                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 p-1.5 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-30"
                >
                    <GripVertical size={14} />
                </div>

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/40 sm:bg-black/0 sm:group-hover:bg-black/70 transition-all flex flex-col items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <div className="flex gap-2 sm:gap-1.5">
                        <button
                            onClick={() => onEdit(img.id)}
                            className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center bg-white/10 text-white hover:bg-secondary hover:text-black transition-all shadow-lg sm:shadow-none"
                            title="Alt-Text bearbeiten"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => onToggleSpan(img.id)}
                            className={`w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center text-white transition-all shadow-lg sm:shadow-none ${img.span ? 'bg-secondary/30 hover:bg-secondary hover:text-black' : 'bg-white/10 hover:bg-white/20'}`}
                            title={img.span ? "Normal (1 Spalte)" : "Breit (2 Spalten)"}
                        >
                            <span className="text-xs sm:text-[10px] font-bold">{img.span ? "2x" : "1x"}</span>
                        </button>
                        <button
                            onClick={() => onDelete(img.id)}
                            className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center bg-white/10 text-white hover:bg-red-500 transition-all shadow-lg sm:shadow-none"
                            title="Bild löschen"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Alt-Text Edit */}
            {isEditing && (
                <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 z-40 overflow-y-auto">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            onEditMetadata(
                                img.id,
                                formData.get('alt') as string,
                                formData.get('description') as string
                            );
                        }}
                        className="w-full space-y-4"
                    >
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">SEO Alt-Text</label>
                            <input
                                name="alt"
                                type="text"
                                defaultValue={img.alt}
                                autoFocus
                                className="w-full bg-black border border-white/10 rounded-none px-3 py-2 text-white text-xs outline-none focus:border-secondary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Anzeige-Beschreibung</label>
                            <input
                                name="description"
                                type="text"
                                defaultValue={img.description}
                                placeholder="Gefühlvoller Text für Frontend..."
                                className="w-full bg-black border border-white/10 rounded-none px-3 py-2 text-white text-xs outline-none focus:border-secondary"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="flex-1 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
                                Speichern
                            </button>
                            <button type="button" onClick={onCancelEdit} className="flex-1 py-2 bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-colors">
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
    );
};

const WebsiteManager = () => {
    const [days, setDays] = useState<DayHours[]>(defaultDays);
    const [images, setImages] = useState<GalleryImage[]>(defaultImages);
    const [contact, setContact] = useState<ContactInfo>(defaultContact);
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);
    const [editingContactField, setEditingContactField] = useState<keyof ContactInfo | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch data from MySQL API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/get-website-data.php?t=${Date.now()}`);
                const data = await res.json();
                if (data.success) {
                    if (data.days) setDays(data.days);
                    if (data.images) setImages(data.images);
                    if (data.contact) setContact(data.contact);
                }
            } catch (err) {
                console.error('Error fetching website data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const flashSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 600);
    };

    const updateDay = async (index: number, hours: string) => {
        const updatedDays = [...days];
        updatedDays[index] = { ...updatedDays[index], hours };
        setDays(updatedDays);
        setEditingDay(null);

        try {
            const res = await fetch('/api/save-website-data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'opening_hours', days: updatedDays })
            });
            const data = await res.json();
            if (data.success) flashSave();
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    const updateContactField = async (field: keyof ContactInfo, value: string) => {
        const updatedContact = { ...contact, [field]: value };
        setContact(updatedContact);
        setEditingContactField(null);

        try {
            const res = await fetch('/api/save-website-data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'contact_info', contact: updatedContact })
            });
            const data = await res.json();
            if (data.success) flashSave();
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    const updateImageMetadata = async (img: GalleryImage) => {
        try {
            const res = await fetch('/api/save-website-data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'update_image', image: img })
            });
            const data = await res.json();
            if (data.success) flashSave();
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = images.findIndex(img => img.id === active.id);
            const newIndex = images.findIndex(img => img.id === over.id);

            const updatedImages = arrayMove(images, oldIndex, newIndex);
            setImages(updatedImages);

            try {
                const res = await fetch('/api/save-website-data.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'reorder_images',
                        ids: updatedImages.map(img => img.id)
                    })
                });
                const data = await res.json();
                if (data.success) flashSave();
            } catch (err) {
                console.error('Reorder failed:', err);
            }
        }
    };

    const updateImageFields = (id: string, alt: string, description: string) => {
        const updated = images.map(img => {
            if (img.id === id) {
                const newImg = { ...img, alt, description };
                updateImageMetadata(newImg);
                return newImg;
            }
            return img;
        });
        setImages(updated);
        setEditingImageId(null);
    };

    const toggleImageSpan = (id: string) => {
        const updated = images.map(img => {
            if (img.id === id) {
                const newImg = { ...img, span: img.span === "col-span-2" ? "" : "col-span-2" };
                updateImageMetadata(newImg);
                return newImg;
            }
            return img;
        });
        setImages(updated);
    };

    const deleteImage = async (id: string) => {
        setConfirmModal({
            title: 'Bild löschen',
            message: 'Möchten Sie dieses Bild wirklich aus der Galerie entfernen?',
            onConfirm: async () => {
                setSaving(true);
                setConfirmModal(null);
                try {
                    const response = await fetch('/api/delete-gallery-image.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id })
                    });
                    const result = await response.json();
                    if (result.success) {
                        setImages(images.filter(img => img.id !== id));
                    }
                } catch (error) {
                    console.error('Error deleting image:', error);
                } finally {
                    setSaving(false);
                }
            }
        });
    };
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) continue;

            const formData = new FormData();
            formData.append('image', file);
            formData.append('alt', file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));

            try {
                const res = await fetch('/api/upload-gallery-image.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    setImages(prev => [...prev, data.image]);
                    flashSave();
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            </div>
        );
    }

    return (
        <div className="relative space-y-12">
            {saving && (
                <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest rounded-none shadow-lg animate-fade-in border border-black/10">
                    <div className="w-2 h-2 bg-black rounded-none animate-ping text-[8px]"></div>
                    Gespeichert
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                {/* Opening Hours */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-widest border-l-4 border-secondary pl-4 flex items-center gap-3">
                            <Clock size={18} className="text-secondary" />
                            Öffnungszeiten
                        </h2>
                    </div>

                    <div className="space-y-1">
                        {days.map((day, index) => (
                            <div
                                key={day.name}
                                className="flex items-center justify-between p-3 h-[64px] bg-white/[0.03] border border-white/5 group hover:border-secondary/20 transition-all"
                            >
                                <span className="text-xs uppercase tracking-widest text-white font-bold w-24 md:w-32 shrink-0">
                                    {day.name}
                                </span>

                                {editingDay === index ? (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                                            updateDay(index, input.value);
                                        }}
                                        className="flex items-center gap-2 flex-grow justify-end"
                                    >
                                        <input
                                            type="text"
                                            defaultValue={day.hours}
                                            autoFocus
                                            className="bg-black/80 border-none rounded-none pl-4 pr-3 py-1.5 text-gray-400 text-xs outline-none focus:ring-0 w-full max-w-[180px] text-right"
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button type="submit" className="p-2 text-green-500/70 hover:text-green-400 -mr-1">
                                                <Save size={18} />
                                            </button>
                                            <button type="button" onClick={() => setEditingDay(null)} className="p-2 text-gray-500 hover:text-white -mr-1">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center gap-1 shrink-0 h-full">
                                        <span className="text-xs text-gray-400 pl-4 py-1.5">{day.hours}</span>
                                        <button
                                            onClick={() => setEditingDay(index)}
                                            className="p-2 text-gray-700 group-hover:text-secondary transition-colors opacity-40 group-hover:opacity-100 -mr-1"
                                        >
                                            <Edit2 size={16} />
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
                        <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-widest border-l-4 border-secondary pl-4 flex items-center gap-3">
                            <MapPin size={18} className="text-secondary" />
                            Kontakt & Adresse
                        </h2>
                    </div>

                    <div className="space-y-1">
                        {[
                            { key: 'name' as keyof ContactInfo, label: 'Name', value: contact.name, icon: <MapPin size={14} className="text-secondary" /> },
                            { key: 'street' as keyof ContactInfo, label: 'Straße', value: contact.street, icon: <MapPin size={14} className="text-secondary" /> },
                            { key: 'city' as keyof ContactInfo, label: 'Stadt', value: contact.city, icon: <MapPin size={14} className="text-secondary" /> },
                            { key: 'phone' as keyof ContactInfo, label: 'Telefon', value: contact.phone, icon: <Phone size={14} className="text-secondary" /> },
                            { key: 'email' as keyof ContactInfo, label: 'E-Mail', value: contact.email, icon: <Mail size={14} className="text-secondary" /> },
                            { key: 'instagram' as keyof ContactInfo, label: 'Instagram', value: contact.instagram, icon: <AtSign size={14} className="text-secondary" /> },
                        ].map((field) => (
                            <div
                                key={field.key}
                                className="flex items-center justify-between p-3 h-[64px] bg-white/[0.03] border border-white/5 group hover:border-secondary/20 transition-all"
                            >
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="w-5 flex justify-center text-secondary">
                                        {field.icon}
                                    </div>
                                    <span className="text-xs uppercase tracking-widest text-white font-bold w-20 md:w-32 shrink-0">
                                        {field.label}
                                    </span>
                                </div>

                                {editingContactField === field.key ? (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                                            updateContactField(field.key, input.value);
                                        }}
                                        className="flex items-center gap-2 flex-grow justify-end"
                                    >
                                        <input
                                            type="text"
                                            defaultValue={field.key === 'instagram' ? contact.instagram : field.value}
                                            autoFocus
                                            className="bg-black/80 border-none rounded-none pl-4 pr-3 py-1.5 text-gray-400 text-xs outline-none focus:ring-0 w-full text-right"
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button type="submit" className="p-2 text-green-500/70 hover:text-green-400 -mr-1">
                                                <Save size={18} />
                                            </button>
                                            <button type="button" onClick={() => setEditingContactField(null)} className="p-2 text-gray-500 hover:text-white -mr-1">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center gap-1 shrink-0 h-full">
                                        <span className="text-xs text-gray-400 pl-4 py-1.5">{field.key === 'instagram' ? `@${contact.instagram}` : field.value}</span>
                                        <button
                                            onClick={() => setEditingContactField(field.key)}
                                            className="p-2 text-gray-700 group-hover:text-secondary transition-colors opacity-40 group-hover:opacity-100 -mr-1"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Gallery */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-widest border-l-4 border-secondary pl-4 flex items-center gap-3">
                        <Image size={18} className="text-secondary" />
                        Impressionen
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
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors rounded-none shadow-lg"
                        >
                            <Plus size={14} />
                            <span className="hidden sm:inline">Bild hochladen</span>
                        </button>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={images.map(img => img.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {images.map((img) => (
                                <SortableGalleryImage
                                    key={img.id}
                                    img={img}
                                    onEdit={setEditingImageId}
                                    onToggleSpan={toggleImageSpan}
                                    onDelete={deleteImage}
                                    isEditing={editingImageId === img.id}
                                    onEditMetadata={updateImageFields}
                                    onCancelEdit={() => setEditingImageId(null)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </section>

            {/* Custom Confirm Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
                    <div className="bg-black border border-white/10 p-6 sm:p-8 w-full max-w-sm relative shadow-2xl">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                                <AlertCircle size={32} className="text-red-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-white font-bold uppercase tracking-widest text-lg">{confirmModal.title}</h3>
                                <p className="text-gray-400 text-xs leading-relaxed">{confirmModal.message}</p>
                            </div>
                            <div className="flex gap-3 w-full mt-4">
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="flex-1 py-3 bg-white/5 text-gray-400 border border-white/10 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className="flex-1 py-3 bg-red-500 text-white font-bold uppercase tracking-widest text-[10px] rounded hover:bg-red-600 transition-all cursor-pointer"
                                >
                                    Löschen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebsiteManager;
