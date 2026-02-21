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
import { GripVertical, Plus, Edit2, Trash2, Palette, Star, X, Save } from 'lucide-react';

interface MenuItem {
    id: string;
    name: string;
    price: number;
    unit: string;
    info: string;
    allergens?: string;
}

interface SubCategory {
    id: string;
    name: string;
    items: MenuItem[];
}

interface Category {
    id: string;
    name: string;
    is_special: boolean;
    bg_color: string;
    badge_text?: string;
    subcategories?: SubCategory[];
    items: MenuItem[];
}

const MenuManager = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [modal, setModal] = useState<{
        type: 'category' | 'subcategory' | 'item';
        mode: 'add' | 'edit';
        data: any;
        parentId?: string;
        grandParentId?: string;
        subcategories?: SubCategory[];
    } | null>(null);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            // Priority 1: Primary PHP API
            let res = await fetch(`/api/get-menu.php?t=${Date.now()}`);
            let contentType = res.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCategories(data);
                    return;
                }
            }

            setCategories([]);
        } catch (err) {
            console.error('Error fetching menu:', err);
        } finally {
            setLoading(false);
        }
    };

    const persistMenu = async (updatedCategories: Category[]) => {
        setSaving(true);
        try {
            await fetch('/api/save-menu.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCategories)
            });
        } catch (err) {
            console.warn('API Save failed:', err);
        } finally {
            setTimeout(() => setSaving(false), 500);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

    const handleDragEndItem = (categoryId: string, subId?: string) => (event: any) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const newCategories = categories.map(cat => {
                if (cat.id === categoryId) {
                    // Drag within subcategory
                    if (subId) {
                        const sub = cat.subcategories?.find(s => s.id === subId);
                        if (sub) {
                            const oldIndex = sub.items.findIndex(i => i.id === active.id);
                            const newIndex = sub.items.findIndex(i => i.id === over.id);
                            if (oldIndex !== -1 && newIndex !== -1) {
                                const newSubItems = arrayMove(sub.items, oldIndex, newIndex);
                                return {
                                    ...cat,
                                    subcategories: cat.subcategories?.map(s => 
                                        s.id === subId ? { ...s, items: newSubItems } : s
                                    )
                                };
                            }
                        }
                    } 
                    // Drag within direct items
                    else {
                        const oldIndex = cat.items.findIndex(i => i.id === active.id);
                        const newIndex = cat.items.findIndex(i => i.id === over.id);
                        if (oldIndex !== -1 && newIndex !== -1) {
                            return { ...cat, items: arrayMove(cat.items, oldIndex, newIndex) };
                        }
                    }
                }
                return cat;
            });
            setCategories(newCategories);
            persistMenu(newCategories);
        }
    };

    const handleDropItem = (categoryId: string, fromSubId: string | null, toSubId: string | null, itemId: string) => {
        if (fromSubId === toSubId) return;
        
        let item: MenuItem | undefined;
        
        const newCategories = categories.map(cat => {
            if (cat.id === categoryId) {
                // Find and remove item from source
                let updatedCat = { ...cat };
                
                if (fromSubId) {
                    const fromSub = updatedCat.subcategories?.find(s => s.id === fromSubId);
                    if (fromSub) {
                        item = fromSub.items.find(i => i.id === itemId);
                        updatedCat = {
                            ...updatedCat,
                            subcategories: updatedCat.subcategories?.map(s => 
                                s.id === fromSubId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
                            )
                        };
                    }
                } else {
                    item = updatedCat.items.find(i => i.id === itemId);
                    updatedCat = {
                        ...updatedCat,
                        items: updatedCat.items.filter(i => i.id !== itemId)
                    };
                }
                
                // Add item to destination
                if (item && toSubId) {
                    const toSub = updatedCat.subcategories?.find(s => s.id === toSubId);
                    if (toSub) {
                        updatedCat = {
                            ...updatedCat,
                            subcategories: updatedCat.subcategories?.map(s => 
                                s.id === toSubId ? { ...s, items: [...s.items, item!] } : s
                            )
                        };
                    }
                } else if (item) {
                    updatedCat = {
                        ...updatedCat,
                        items: [...updatedCat.items, item]
                    };
                }
                
                return updatedCat;
            }
            return cat;
        });
        
        setCategories(newCategories);
        persistMenu(newCategories);
    };

    const handleSave = () => {
        if (!modal) return;
        const { type, mode, data, parentId, grandParentId, subcategories } = modal;
        let newCategories = [...categories];

        if (type === 'category') {
            if (mode === 'add') {
                const newCat: Category = { ...data, id: `cat-${Date.now()}`, items: [], subcategories: [] };
                newCategories = [...newCategories, newCat];
            } else {
                newCategories = newCategories.map(c => c.id === data.id ? { ...c, ...data } : c);
            }
        } else if (type === 'subcategory' && parentId) {
            if (mode === 'add') {
                const newSub: SubCategory = { ...data, id: `sub-${Date.now()}`, items: [] };
                newCategories = newCategories.map(c => 
                    c.id === parentId ? { ...c, subcategories: [...(c.subcategories || []), newSub] } : c
                );
            } else {
                newCategories = newCategories.map(c =>
                    c.id === parentId ? { 
                        ...c, 
                        subcategories: (c.subcategories || []).map(s => s.id === data.id ? { ...s, ...data } : s) 
                    } : c
                );
            }
        } else if (type === 'item') {
            const selectedSubId = data.subcategory_id;
            const catId = grandParentId || parentId;
            
            if (!catId) {
                setModal(null);
                return;
            }
            
            if (selectedSubId) {
                if (mode === 'add') {
                    const newItem: MenuItem = { ...data, id: `item-${Date.now()}` };
                    newCategories = newCategories.map(c => {
                        if (c.id !== catId) return c;
                        const updatedSubcategories = (c.subcategories || []).map(s => {
                            if (s.id === selectedSubId) {
                                return { ...s, items: [...s.items, newItem] };
                            }
                            return s;
                        });
                        return { ...c, subcategories: updatedSubcategories };
                    });
                } else {
                    newCategories = newCategories.map(c => {
                        if (c.id !== catId) return c;
                        
                        let updatedSubcategories = (c.subcategories || []).map(s => ({
                            ...s,
                            items: s.items.filter(i => i.id !== data.id)
                        }));
                        
                        updatedSubcategories = updatedSubcategories.map(s => {
                            if (s.id === selectedSubId) {
                                const existingIndex = s.items.findIndex(i => i.id === data.id);
                                if (existingIndex >= 0) {
                                    return {
                                        ...s,
                                        items: s.items.map(i => i.id === data.id ? { ...i, ...data } : i)
                                    };
                                } else {
                                    return { ...s, items: [...s.items, { ...data }] };
                                }
                            }
                            return s;
                        });
                        
                        return { ...c, subcategories: updatedSubcategories };
                    });
                }
            } else {
                if (mode === 'add') {
                    const newItem: MenuItem = { ...data, id: `item-${Date.now()}` };
                    newCategories = newCategories.map(c => {
                        if (c.id !== catId) return c;
                        const updatedSubcategories = (c.subcategories || []).map(s => ({
                            ...s,
                            items: s.items.filter(i => i.id !== newItem.id)
                        }));
                        return { ...c, items: [...c.items, newItem], subcategories: updatedSubcategories };
                    });
                } else {
                    newCategories = newCategories.map(c => {
                        if (c.id !== catId) return c;
                        
                        let updatedSubcategories = (c.subcategories || []).map(s => ({
                            ...s,
                            items: s.items.filter(i => i.id !== data.id)
                        }));
                        
                        const existingIndex = c.items.findIndex(i => i.id === data.id);
                        let updatedItems;
                        if (existingIndex >= 0) {
                            updatedItems = c.items.map(i => i.id === data.id ? { ...i, ...data } : i);
                        } else {
                            updatedItems = [...c.items, { ...data }];
                        }
                        
                        return { ...c, items: updatedItems, subcategories: updatedSubcategories };
                    });
                }
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

    const deleteSubcategory = (catId: string, subId: string) => {
        if (confirm('Unterkategorie wirklich löschen?')) {
            const newCategories = categories.map(c =>
                c.id === catId ? { ...c, subcategories: (c.subcategories || []).filter(s => s.id !== subId) } : c
            );
            setCategories(newCategories);
            persistMenu(newCategories);
        }
    };

    const deleteItem = (catId: string, itemId: string, subId?: string) => {
        if (confirm('Artikel wirklich löschen?')) {
            let newCategories;
            if (subId) {
                newCategories = categories.map(c =>
                    c.id === catId ? {
                        ...c,
                        subcategories: (c.subcategories || []).map(s =>
                            s.id === subId ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
                        )
                    } : c
                );
            } else {
                newCategories = categories.map(c =>
                    c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
                );
            }
            setCategories(newCategories);
            persistMenu(newCategories);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse uppercase tracking-widest text-xs">Lade Menü...</div>;

    return (
        <div className="relative">
            {saving && (
                <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest rounded-none shadow-lg animate-fade-in border border-black/10">
                    <div className="w-2 h-2 bg-black rounded-none animate-ping text-[8px]"></div>
                    Speichern...
                </div>
            )}

            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest italic border-l-4 border-secondary pl-4">Menü-Verwaltung</h2>
                <button
                    onClick={() => setModal({ type: 'category', mode: 'add', data: { name: '', is_special: false, bg_color: '#000000', badge_text: 'Special' } })}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors rounded-none shadow-lg"
                >
                    <Plus size={14} /> Kategorie hinzufügen
                </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                        {categories.map((category) => (
                            <SortableCategory
                                key={category.id}
                                category={category}
                                onEdit={() => setModal({ type: 'category', mode: 'edit', data: category })}
                                onDelete={() => deleteCategory(category.id)}
                                onAddItem={() => setModal({ type: 'item', mode: 'add', data: { name: '', price: 0, unit: '', info: '', allergens: '', subcategory_id: '' }, parentId: category.id, grandParentId: category.id, subcategories: category.subcategories || [] })}
                                onEditItem={(item) => setModal({ type: 'item', mode: 'edit', data: { ...item, subcategory_id: '' }, parentId: category.id, grandParentId: category.id, subcategories: category.subcategories || [] })}
                                onDeleteItem={(itemId, subId) => deleteItem(category.id, itemId, subId)}
                                onDragEndItem={handleDragEndItem}
                                onAddSubcategory={() => setModal({ type: 'subcategory', mode: 'add', data: { name: '' }, parentId: category.id })}
                                onEditSubcategory={(sub) => setModal({ type: 'subcategory', mode: 'edit', data: sub, parentId: category.id })}
                                onDeleteSubcategory={(subId) => deleteSubcategory(category.id, subId)}
                                onEditSubItem={(item, subId) => setModal({ type: 'item', mode: 'edit', data: { ...item, subcategory_id: subId }, parentId: subId, grandParentId: category.id, subcategories: category.subcategories || [] })}
                                onDeleteSubItem={(itemId, subId) => deleteItem(category.id, itemId, subId)}
                                setModal={setModal}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {modal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80">
                    <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-lg p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold uppercase tracking-widest text-secondary">
                                {modal.mode === 'add' ? 'Neu:' : 'Bearbeiten:'} {modal.type === 'category' ? 'Kategorie' : modal.type === 'subcategory' ? 'Unterkategorie' : 'Artikel'}
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
                                            className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2.5 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 py-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Hervorgehoben / Spezial?</label>
                                        <input
                                            type="checkbox"
                                            checked={modal.data.is_special}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, is_special: e.target.checked } })}
                                            className="w-5 h-5 rounded border-2 border-white/20 bg-[#0a0a0a] cursor-pointer accent-secondary"
                                        />
                                    </div>
                                    {modal.data.is_special && (
                                        <>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Badge Text</label>
                                                <input
                                                    type="text"
                                                    value={modal.data.badge_text || ''}
                                                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, badge_text: e.target.value } })}
                                                    placeholder="z.B. Special, Promo..."
                                                    className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2.5 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Hintergrundfarbe (Hex)</label>
                                                <div className="flex gap-4">
                                                    <input
                                                        type="color"
                                                        value={modal.data.bg_color}
                                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, bg_color: e.target.value } })}
                                                        className="w-12 h-12 rounded border-2 border-white/20 bg-[#0a0a0a] cursor-pointer shadow-inner"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={modal.data.bg_color}
                                                        onChange={(e) => setModal({ ...modal, data: { ...modal.data, bg_color: e.target.value } })}
                                                        className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all placeholder:text-gray-600"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : modal.type === 'subcategory' ? (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</label>
                                        <input
                                            type="text"
                                            value={modal.data.name}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                                            className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2.5 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {modal.subcategories && modal.subcategories.length > 0 && (
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Unterkategorie</label>
                                            <select
                                                value={modal.data.subcategory_id || ''}
                                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, subcategory_id: e.target.value } })}
                                                className="bg-black border border-white/10 rounded-none px-4 py-2.5 text-white outline-none focus:border-secondary transition-colors appearance-none cursor-pointer"
                                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
                                            >
                                                <option value="" className="bg-black text-gray-400">Keine Unterkategorie</option>
                                                {modal.subcategories.map((sub: SubCategory) => (
                                                    <option key={sub.id} value={sub.id} className="bg-black text-white">{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</label>
                                        <input
                                            type="text"
                                            value={modal.data.name}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                                            className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2.5 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
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
                                                className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2.5 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Einheit (z.B. 0.4l)</label>
                                            <input
                                                type="text"
                                                value={modal.data.unit}
                                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, unit: e.target.value } })}
                                                className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2.5 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Info / Zutaten</label>
                                        <textarea
                                            value={modal.data.info}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, info: e.target.value } })}
                                            className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all h-24 resize-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Allergene</label>
                                        <input
                                            type="text"
                                            value={modal.data.allergens || ''}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, allergens: e.target.value } })}
                                            placeholder="z.B. A, B, C, D..."
                                            className="bg-[#0a0a0a] border border-white/10 rounded px-4 py-2.5 text-white outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                onClick={handleSave}
                                className="w-full mt-6 py-3 bg-secondary text-black font-bold uppercase tracking-widest rounded hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2"
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
    category, onEdit, onDelete, onAddItem, onEditItem, onDeleteItem, onDragEndItem, onAddSubcategory, onEditSubcategory, onDeleteSubcategory, onEditSubItem, onDeleteSubItem, setModal
}: {
    category: Category, onEdit: () => void, onDelete: () => void, onAddItem: () => void, onEditItem: (i: MenuItem) => void, onDeleteItem: (id: string, subId?: string) => void, onDragEndItem: (catId: string) => (event: any) => void, onAddSubcategory: () => void, onEditSubcategory: (s: SubCategory) => void, onDeleteSubcategory: (subId: string) => void, onEditSubItem: (item: MenuItem, subId: string) => void, onDeleteSubItem: (itemId: string, subId: string) => void, setModal: (modal: any) => void
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const color = category.bg_color || '#ffe08a';
    const dynamicStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: category.is_special ? color + '15' : 'transparent',
        borderColor: category.is_special ? color + '30' : 'transparent',
        boxShadow: category.is_special ? `0 0 40px ${color}15` : 'none'
    };

    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const hasDirectItems = category.items && category.items.length > 0;

    return (
        <div ref={setNodeRef} style={dynamicStyle} className="p-6 rounded-none border transition-all duration-300">
            <div className="flex items-center gap-4">
                <button {...attributes} {...listeners} className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-white transition-colors flex-shrink-0">
                    <GripVertical size={20} />
                </button>

                <div className="flex-grow flex items-center justify-between ml-2">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 ${category.is_special ? 'text-secondary' : 'text-white'}`}>
                            <span className="text-xl font-bold uppercase tracking-tight leading-none">
                                {category.name}
                            </span>
                            {hasSubcategories && (
                                <span className="text-[9px] text-white/40 bg-white/5 px-2 py-1 rounded border border-white/10">
                                    {category.subcategories?.length} {category.subcategories?.length === 1 ? 'Unterkategorie' : 'Unterkategorien'}
                                </span>
                            )}
                            {hasSubcategories && (
                                <span className="text-[9px] text-white/40 bg-white/5 px-2 py-1 rounded border border-white/10">
                                    {(category.items?.length || 0) + (category.subcategories?.reduce((acc, sub) => acc + (sub.items?.length || 0), 0) || 0)} Artikel
                                </span>
                            )}
                            {!hasSubcategories && (
                                <span className="text-[9px] text-white/70 bg-white/10 px-2.5 py-1 rounded-none border border-white/10 font-mono">
                                    {category.items?.length || 0} Artikel
                                </span>
                            )}
                            {!!category.is_special && <Star size={14} className="text-secondary fill-secondary animate-pulse" />}
                            {!!category.is_special && <span className="text-[8px] bg-secondary text-black font-black px-1.5 py-1 rounded-none uppercase tracking-tighter leading-none h-4 flex items-center">{category.badge_text || 'Spezial'}</span>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={onAddSubcategory} className="p-2 bg-white/5 rounded-none text-gray-500 hover:text-secondary hover:bg-secondary/10 transition-all font-bold text-[10px]" title="Unterkategorie hinzufügen"><Plus size={16} /></button>
                        <button onClick={onEdit} className="p-2 bg-white/5 rounded-none text-gray-500 hover:text-secondary hover:bg-secondary/10 transition-all font-bold text-[10px]" title="Kategorie bearbeiten"><Edit2 size={16} /></button>
                        <button onClick={onDelete} className="p-2 bg-white/5 rounded-none text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-[10px]" title="Kategorie löschen"><Trash2 size={16} /></button>
                        <div className="w-8 h-8 rounded-none border-2 border-white/20 ml-2 shadow-inner" style={{ backgroundColor: category.bg_color }}></div>
                    </div>
                </div>
            </div>

            <div className="mt-6 ml-12 border-l-2 border-white/5 pl-8 space-y-4">
                <button
                    onClick={onAddItem}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary/5 border border-secondary/20 text-[10px] uppercase font-bold text-secondary/70 hover:text-secondary hover:bg-secondary/10 hover:border-secondary/40 transition-all rounded-none group mt-2 mb-6"
                >
                    <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Artikel hinzufügen
                </button>

                {hasSubcategories && (
                    <div className="space-y-3 mb-6">
                        {category.subcategories?.map(sub => (
                            <SubCategoryBox
                                key={sub.id}
                                subcategory={sub}
                                categoryId={category.id}
                                subcategories={category.subcategories || []}
                                onEdit={() => onEditSubcategory(sub)}
                                onDelete={() => onDeleteSubcategory(sub.id)}
                                onAddItems={() => setModal({ type: 'item', mode: 'add', data: { name: '', price: 0, unit: '', info: '', allergens: '', subcategory_id: sub.id }, parentId: sub.id, grandParentId: category.id, subcategories: category.subcategories || [] })}
                                onEditItem={(item) => onEditSubItem(item, sub.id)}
                                onDeleteItem={(itemId) => onDeleteSubItem(itemId, sub.id)}
                                onDragEnd={onDragEndItem(category.id, sub.id)}
                            />
                        ))}
                    </div>
                )}

                {hasDirectItems ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndItem(category.id)}>
                        <SortableContext items={category.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-2">
                                {category.items.map(item => (
                                    <SortableItem 
                                        key={item.id} 
                                        item={item} 
                                        onEdit={() => onEditItem(item)} 
                                        onDelete={() => onDeleteItem(item.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <p className="text-[10px] text-gray-600 italic">Noch keine Artikel vorhanden.</p>
                )}
            </div>
        </div>
    );
};

const SubCategoryBox = ({ subcategory, categoryId, onEdit, onDelete, onAddItems, onEditItem, onDeleteItem, onDragEnd }: {
    subcategory: SubCategory, categoryId: string, onEdit: () => void, onDelete: () => void, onAddItems: () => void, onEditItem: (i: MenuItem) => void, onDeleteItem: (id: string) => void, onDragEnd: (event: any) => void
}) => {
    const hasItems = subcategory.items && subcategory.items.length > 0;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    return (
        <div className="bg-black/30 border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    <span className="text-white font-bold text-xs uppercase tracking-wide">{subcategory.name}</span>
                    <span className="text-[9px] text-gray-500">({subcategory.items?.length || 0})</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onAddItems} className="p-1.5 text-gray-500 hover:text-secondary transition-colors" title="Artikel hinzufügen"><Plus size={14} /></button>
                    <button onClick={onEdit} className="p-1.5 text-gray-500 hover:text-secondary transition-colors" title="Bearbeiten"><Edit2 size={14} /></button>
                    <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors" title="Löschen"><Trash2 size={14} /></button>
                </div>
            </div>

            {hasItems ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={subcategory.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-2">
                            {subcategory.items.map(item => (
                                <SortableItem 
                                    key={item.id} 
                                    item={item} 
                                    onEdit={() => onEditItem(item)} 
                                    onDelete={() => onDeleteItem(item.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <p className="text-[9px] text-gray-600 italic">Keine Artikel</p>
            )}
        </div>
    );
};

const SortableItem = ({ item, onEdit, onDelete }: { 
    item: MenuItem, onEdit: () => void, onDelete: () => void
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5 group hover:border-secondary/20 transition-all">
            <div className="flex items-center gap-2 flex-grow min-w-0">
                <button {...attributes} {...listeners} className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-secondary transition-colors flex-shrink-0">
                    <GripVertical size={14} />
                </button>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold text-xs truncate uppercase tracking-wide">{item.name}</h4>
                        <span className="text-[9px] text-gray-500 font-mono whitespace-nowrap">({item.unit || '-'})</span>
                    </div>
                    <p className="text-[9px] text-gray-600 italic truncate">{item.info || 'Keine Info'}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
                <span className="text-secondary font-bold text-xs min-w-[50px] text-right">
                    {typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}€
                </span>
                <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded transition-all"><Edit2 size={12} /></button>
                    <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"><Trash2 size={12} /></button>
                </div>
            </div>
        </div>
    );
};

export default MenuManager;
