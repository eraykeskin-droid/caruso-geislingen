import React, { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Edit2, Trash2, Palette, Star, X, Save, Check } from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
    price: number;
    unit: string;
    info: string;
}

interface Category {
    id: string;
    name: string;
    is_special: boolean;
    bg_color: string;
    items: MenuItem[];
}

const MenuManager = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [modal, setModal] = useState<{
        type: 'category' | 'item';
        mode: 'add' | 'edit';
        data: any;
        parentId?: string;
    } | null>(null);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/get-menu.php');
            const contentType = res.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCategories(data);
                    // Also sync to local storage for dev reference
                    localStorage.setItem('caruso_menu_cache', JSON.stringify(data));
                    return;
                }
            }

            // Fallback for local development or if API fails
            const cached = localStorage.getItem('caruso_menu_cache');
            if (cached) {
                setCategories(JSON.parse(cached));
            } else {
                // Initial Default Data
                const defaultData = [
                    {
                        id: 'cat-1',
                        name: 'Cocktails',
                        is_special: true,
                        bg_color: '#ffe08a',
                        items: [
                            { id: 'item-1', name: 'Sex on the Beach', price: 9.5, unit: '0,4l', info: 'Wodka, Pfirsich...' }
                        ]
                    }
                ];
                setCategories(defaultData);
            }
        } catch (err) {
            console.error('Error fetching menu, using cache:', err);
            const cached = localStorage.getItem('caruso_menu_cache');
            if (cached) setCategories(JSON.parse(cached));
        } finally {
            setLoading(false);
        }
    };

    const persistMenu = async (updatedCategories: Category[]) => {
        setSaving(true);
        // Always save to localStorage for local dev persistence
        localStorage.setItem('caruso_menu_cache', JSON.stringify(updatedCategories));

        try {
            const res = await fetch('/api/save-menu.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCategories)
            });
            // If it's a PHP source or fails, we still have localStorage
        } catch (err) {
            console.warn('API Save failed (expected in local dev), saved to LocalStorage.');
        } finally {
            setTimeout(() => setSaving(false), 500);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const oldIndex = categories.findIndex((i) => i.id === active.id);
            const newIndex = categories.findIndex((i) => i.id === over.id);
            const newCategories = arrayMove(categories, oldIndex, newIndex);
            setCategories(newCategories);
            persistMenu(newCategories);
        }
    };

    const handleSave = () => {
        if (!modal) return;

        const { type, mode, data, parentId } = modal;
        let newCategories = [...categories];

        if (type === 'category') {
            if (mode === 'add') {
                const newCat: Category = {
                    ...data,
                    id: `cat-${Date.now()}`,
                    items: []
                };
                newCategories = [...newCategories, newCat];
            } else {
                newCategories = newCategories.map(c => c.id === data.id ? { ...c, ...data } : c);
            }
        } else if (type === 'item' && parentId) {
            if (mode === 'add') {
                const newItem: MenuItem = {
                    ...data,
                    id: `item-${Date.now()}`
                };
                newCategories = newCategories.map(c =>
                    c.id === parentId ? { ...c, items: [...c.items, newItem] } : c
                );
            } else {
                newCategories = newCategories.map(c =>
                    c.id === parentId
                        ? { ...c, items: c.items.map(i => i.id === data.id ? { ...i, ...data } : i) }
                        : c
                );
            }
        }
        setCategories(newCategories);
        persistMenu(newCategories);
        setModal(null);
    };

    const deleteCategory = (id: string) => {
        if (confirm('Kategorie wirklich löschen?')) {
            const newCategories = categories.filter(c => c.id !== id);
            setCategories(newCategories);
            persistMenu(newCategories);
        }
    };

    const deleteItem = (catId: string, itemId: string) => {
        if (confirm('Artikel wirklich löschen?')) {
            const newCategories = categories.map(c =>
                c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
            );
            setCategories(newCategories);
            persistMenu(newCategories);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse uppercase tracking-widest text-xs">Lade Menü...</div>;

    return (
        <div className="p-6 relative">
            {saving && (
                <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg animate-fade-in border border-black/10">
                    <div className="w-2 h-2 bg-black rounded-full animate-ping"></div>
                    Speichern...
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest italic border-l-4 border-secondary pl-4">Menü-Verwaltung</h2>
                <button
                    onClick={() => setModal({ type: 'category', mode: 'add', data: { name: '', is_special: false, bg_color: '#000000' } })}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors rounded shadow-lg"
                >
                    <Plus size={14} /> Kategorie hinzufügen
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={categories.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-6">
                        {categories.map((category) => (
                            <SortableCategory
                                key={category.id}
                                category={category}
                                onEdit={() => setModal({ type: 'category', mode: 'edit', data: category })}
                                onDelete={() => deleteCategory(category.id)}
                                onAddItem={() => setModal({ type: 'item', mode: 'add', data: { name: '', price: 0, unit: '', info: '' }, parentId: category.id })}
                                onEditItem={(item) => setModal({ type: 'item', mode: 'edit', data: item, parentId: category.id })}
                                onDeleteItem={(itemId) => deleteItem(category.id, itemId)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold uppercase tracking-widest text-secondary">
                                {modal.mode === 'add' ? 'Neu:' : 'Bearbeiten:'} {modal.type === 'category' ? 'Kategorie' : 'Artikel'}
                            </h3>
                            <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {modal.type === 'category' ? (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</label>
                                        <input
                                            type="text"
                                            value={modal.data.name}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                                            className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-secondary transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 py-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Highlight / Special?</label>
                                        <input
                                            type="checkbox"
                                            checked={modal.data.is_special}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, is_special: e.target.checked } })}
                                            className="w-5 h-5 accent-secondary"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Hintergrundfarbe (Hex)</label>
                                        <div className="flex gap-4">
                                            <input
                                                type="color"
                                                value={modal.data.bg_color}
                                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, bg_color: e.target.value } })}
                                                className="w-10 h-10 rounded border border-white/10 bg-black cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={modal.data.bg_color}
                                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, bg_color: e.target.value } })}
                                                className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-secondary flex-grow"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</label>
                                        <input
                                            type="text"
                                            value={modal.data.name}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                                            className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-secondary transition-colors"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Preis (€)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={modal.data.price}
                                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, price: parseFloat(e.target.value) } })}
                                                className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-secondary transition-colors"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Einheit (z.B. 0.4l)</label>
                                            <input
                                                type="text"
                                                value={modal.data.unit}
                                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, unit: e.target.value } })}
                                                className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-secondary transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Info / Zutaten</label>
                                        <textarea
                                            value={modal.data.info}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, info: e.target.value } })}
                                            className="bg-black border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-secondary transition-colors h-24 resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                onClick={handleSave}
                                className="w-full mt-6 py-3 bg-secondary text-black font-bold uppercase tracking-widest rounded-lg hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SortableCategory = ({
    category, onEdit, onDelete, onAddItem, onEditItem, onDeleteItem
}: {
    category: Category, onEdit: () => void, onDelete: () => void, onAddItem: () => void, onEditItem: (i: MenuItem) => void, onDeleteItem: (id: string) => void
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-6 rounded-2xl border ${category.is_special ? 'bg-secondary/10 border-secondary/30 shadow-[0_0_30px_rgba(255,224,138,0.05)]' : 'bg-white/[0.03] border-white/10'}`}
        >
            <div className="flex items-center gap-4">
                <button {...attributes} {...listeners} className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-white transition-colors">
                    <GripVertical size={20} />
                </button>

                <div className="flex-grow flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold uppercase tracking-tight ${category.is_special ? 'text-secondary' : 'text-white'}`}>
                            {category.name}
                        </span>
                        {category.is_special && <Star size={14} className="text-secondary fill-secondary animate-pulse" />}
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={onEdit} className="p-2 bg-white/5 rounded text-gray-500 hover:text-secondary hover:bg-secondary/10 transition-all"><Edit2 size={16} /></button>
                        <button onClick={onDelete} className="p-2 bg-white/5 rounded text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 size={16} /></button>
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 ml-4 shadow-inner" style={{ backgroundColor: category.bg_color }}></div>
                    </div>
                </div>
            </div>

            <div className="mt-6 ml-12 border-l-2 border-white/5 pl-8 space-y-4">
                <button
                    onClick={onAddItem}
                    className="text-[10px] uppercase font-bold text-gray-500 hover:text-secondary transition-colors flex items-center gap-2 mb-6 group"
                >
                    <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Artikel hinzufügen
                </button>

                {category.items && category.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.items.map(item => (
                            <div key={item.id} className="p-4 bg-black/40 rounded-xl border border-white/5 group hover:border-secondary/20 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="text-white font-bold text-sm tracking-wide">{item.name}</h4>
                                        <span className="text-[10px] text-gray-500 uppercase">{item.unit}</span>
                                    </div>
                                    <span className="text-secondary font-bold text-sm">{typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}€</span>
                                </div>
                                <p className="text-[10px] text-gray-600 mb-4 italic truncate">{item.info}</p>
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEditItem(item)} className="p-1.5 text-gray-500 hover:text-secondary"><Edit2 size={12} /></button>
                                    <button onClick={() => onDeleteItem(item.id)} className="p-1.5 text-gray-500 hover:text-red-500"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[10px] text-gray-600 italic">Noch keine Artikel vorhanden.</p>
                )}
            </div>
        </div>
    );
};

export default MenuManager;
