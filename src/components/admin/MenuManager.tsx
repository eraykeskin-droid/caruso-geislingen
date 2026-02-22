import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Edit2, Trash2, Palette, Star, X, Save, Eye, EyeOff, FolderPlus, FilePlus, ChevronDown, MoreHorizontal, Layers, FileText, ArrowUpDown } from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    is_hidden: boolean;
    bg_color: string;
    badge_text?: string;
    subcategories?: SubCategory[];
    items: MenuItem[];
}

const MenuManager = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [sortModal, setSortModal] = useState<{
        type: 'categories' | 'subcategories' | 'items';
        parentId?: string;
        subId?: string;
        items: { id: string, name: string }[];
    } | null>(null);

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

    const handleSortSave = (newOrderIds: string[]) => {
        if (!sortModal) return;
        const { type, parentId, subId } = sortModal;
        let newCategories = [...categories];

        if (type === 'categories') {
            newCategories = newOrderIds.map(id => categories.find(c => c.id === id)!);
        } else if (type === 'subcategories' && parentId) {
            newCategories = categories.map(cat => {
                if (cat.id === parentId && cat.subcategories) {
                    const reorderedSubs = newOrderIds.map(id => cat.subcategories!.find(s => s.id === id)!);
                    return { ...cat, subcategories: reorderedSubs };
                }
                return cat;
            });
        } else if (type === 'items' && parentId) {
            newCategories = categories.map(cat => {
                if (cat.id === parentId) {
                    if (subId) {
                        const updatedSubs = cat.subcategories?.map(sub => {
                            if (sub.id === subId) {
                                const reorderedItems = newOrderIds.map(id => sub.items.find(i => i.id === id)!);
                                return { ...sub, items: reorderedItems };
                            }
                            return sub;
                        });
                        return { ...cat, subcategories: updatedSubs };
                    } else {
                        const reorderedItems = newOrderIds.map(id => cat.items.map(i => i).find(i => i.id === id)!);
                        return { ...cat, items: reorderedItems };
                    }
                }
                return cat;
            });
        }

        setCategories(newCategories);
        persistMenu(newCategories);
        setSortModal(null);
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

    const toggleCategoryVisibility = (id: string) => {
        const newCategories = categories.map(c =>
            c.id === id ? { ...c, is_hidden: !c.is_hidden } : c
        );
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

                        // Ensure it's removed from direct items if it was moved from there
                        const updatedItems = c.items.filter(i => i.id !== data.id);

                        const updatedSubcategories = (c.subcategories || []).map(s => {
                            if (s.id === selectedSubId) {
                                const existingIndex = s.items.findIndex(i => i.id === data.id);
                                if (existingIndex >= 0) {
                                    // Update in place preserving position
                                    return {
                                        ...s,
                                        items: s.items.map(i => i.id === data.id ? { ...i, ...data } : i)
                                    };
                                } else {
                                    // Moving into this subcategory, append at the end
                                    return { ...s, items: [...s.items, { ...data }] };
                                }
                            } else {
                                // If it's a different subcategory, remove it (in case it was moved from here)
                                return {
                                    ...s,
                                    items: s.items.filter(i => i.id !== data.id)
                                };
                            }
                        });

                        return { ...c, items: updatedItems, subcategories: updatedSubcategories };
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
                {categories.length > 1 && (
                    <button
                        onClick={() => setSortModal({
                            type: 'categories',
                            items: categories.map(c => ({ id: c.id, name: c.name }))
                        })}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        <ArrowUpDown size={14} /> Sortieren
                    </button>
                )}
            </div>

            <div className="space-y-6">
                {categories.map((category) => (
                    <SortableCategory
                        key={category.id}
                        category={category}
                        onEdit={() => setModal({ type: 'category', mode: 'edit', data: category })}
                        onEditItem={(item) => setModal({ type: 'item', mode: 'edit', data: { ...item, subcategory_id: '' }, parentId: category.id, grandParentId: category.id, subcategories: category.subcategories || [] })}
                        onDeleteItem={(itemId, subId?: string) => deleteItem(category.id, itemId, subId)}
                        onEditSubcategory={(sub) => setModal({ type: 'subcategory', mode: 'edit', data: sub, parentId: category.id })}
                        onEditSubItem={(item, subId) => setModal({ type: 'item', mode: 'edit', data: { ...item, subcategory_id: subId }, parentId: subId, grandParentId: category.id, subcategories: category.subcategories || [] })}
                        onDeleteSubItem={(itemId, subId) => deleteItem(category.id, itemId, subId)}
                        onToggleVisibility={() => toggleCategoryVisibility(category.id)}
                        setModal={setModal}
                        setSortModal={setSortModal}
                    />
                ))}
            </div>

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
                                            className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 py-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Hervorgehoben / Spezial?</label>
                                        <input
                                            type="checkbox"
                                            checked={!!modal.data.is_special}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, is_special: e.target.checked } })}
                                            className="w-5 h-5 rounded border-2 border-white/20 bg-[#0a0a0a] cursor-pointer accent-secondary"
                                        />
                                    </div>
                                    {!!modal.data.is_special && (
                                        <>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Badge Text</label>
                                                <input
                                                    type="text"
                                                    value={modal.data.badge_text || ''}
                                                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, badge_text: e.target.value } })}
                                                    placeholder="z.B. Special, Promo..."
                                                    className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full"
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
                                                        className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm placeholder:text-gray-600 flex-1"
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
                                            className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full"
                                        />
                                    </div>
                                    {modal.mode === 'add' && (
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">In Kategorie</label>
                                            <select
                                                value={modal.parentId}
                                                onChange={(e) => setModal({ ...modal, parentId: e.target.value })}
                                                className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full appearance-none"
                                            >
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {modal.mode === 'add' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Kategorie</label>
                                                <select
                                                    value={modal.parentId}
                                                    onChange={(e) => {
                                                        const catId = e.target.value;
                                                        const cat = categories.find(c => c.id === catId);
                                                        setModal({
                                                            ...modal,
                                                            parentId: catId,
                                                            grandParentId: catId,
                                                            subcategories: cat?.subcategories || [],
                                                            data: { ...modal.data, subcategory_id: '' }
                                                        });
                                                    }}
                                                    className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full appearance-none"
                                                >
                                                    {categories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Unterkategorie</label>
                                                <select
                                                    value={modal.data.subcategory_id}
                                                    onChange={(e) => setModal({ ...modal, data: { ...modal.data, subcategory_id: e.target.value } })}
                                                    className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full appearance-none"
                                                >
                                                    <option value="">Keine</option>
                                                    {(modal.subcategories || []).map((sub: SubCategory) => (
                                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        modal.subcategories && modal.subcategories.length > 0 && (
                                            <div className="flex flex-col gap-2 relative">
                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Unterkategorie</label>
                                                <div className="relative">
                                                    <div
                                                        className="bg-black/50 border border-white/10 rounded-none px-4 py-3 text-sm cursor-pointer hover:border-secondary/50 transition-colors flex items-center justify-between"
                                                        onClick={() => setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen)}
                                                    >
                                                        <span className={modal.data.subcategory_id ? "text-white" : "text-white/25"}>
                                                            {modal.data.subcategory_id
                                                                ? modal.subcategories.find((s: SubCategory) => s.id === modal.data.subcategory_id)?.name
                                                                : 'Keine Unterkategorie wählen ...'}
                                                        </span>
                                                        <ChevronDown size={14} className={`text-secondary transition-transform ${isSubcategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    {isSubcategoryDropdownOpen && (
                                                        <div className="absolute z-[250] left-0 right-0 mt-1 bg-black border border-white/10 max-h-52 overflow-y-auto w-full shadow-2xl">
                                                            <div
                                                                className="px-4 py-2.5 text-sm text-gray-300 hover:bg-secondary/10 hover:text-white cursor-pointer transition-colors"
                                                                onClick={() => { setModal({ ...modal, data: { ...modal.data, subcategory_id: '' } }); setIsSubcategoryDropdownOpen(false); }}
                                                            >
                                                                Keine Unterkategorie
                                                            </div>
                                                            {modal.subcategories.map((sub: SubCategory) => (
                                                                <div
                                                                    key={sub.id}
                                                                    className="px-4 py-2.5 text-sm text-gray-300 hover:bg-secondary/10 hover:text-white cursor-pointer transition-colors"
                                                                    onClick={() => { setModal({ ...modal, data: { ...modal.data, subcategory_id: sub.id } }); setIsSubcategoryDropdownOpen(false); }}
                                                                >
                                                                    {sub.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Name</label>
                                        <input
                                            type="text"
                                            value={modal.data.name}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
                                            className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full"
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
                                                className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Einheit (z.B. 0.4l)</label>
                                            <input
                                                type="text"
                                                value={modal.data.unit}
                                                onChange={(e) => setModal({ ...modal, data: { ...modal.data, unit: e.target.value } })}
                                                className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Info / Zutaten</label>
                                        <textarea
                                            value={modal.data.info}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, info: e.target.value } })}
                                            className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full h-24 resize-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Allergene</label>
                                        <input
                                            type="text"
                                            value={modal.data.allergens || ''}
                                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, allergens: e.target.value } })}
                                            placeholder="z.B. A, B, C, D..."
                                            className="bg-black/50 border border-white/10 rounded-none px-4 py-3 focus:outline-none focus:border-secondary transition-colors text-white text-sm w-full"
                                        />
                                    </div>
                                </>
                            )}

                            {modal.mode === 'edit' && (
                                (() => {
                                    const showSubs = modal.type === 'category' && modal.data.subcategories && modal.data.subcategories.length > 1;
                                    const showItems = (modal.type === 'category' && modal.data.items && modal.data.items.length > 1) ||
                                        (modal.type === 'subcategory' && modal.data.items && modal.data.items.length > 1);

                                    if (!showSubs && !showItems) return null;

                                    return (
                                        <div className="space-y-2 py-4 border-y border-white/5">
                                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 block">Sortierung</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {showSubs && (
                                                    <button
                                                        onClick={() => {
                                                            setModal(null);
                                                            setSortModal({
                                                                type: 'subcategories',
                                                                parentId: modal.data.id,
                                                                items: modal.data.subcategories.map((s: any) => ({ id: s.id, name: s.name }))
                                                            });
                                                        }}
                                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                                                    >
                                                        <ArrowUpDown size={14} /> Unterkategorien sortieren
                                                    </button>
                                                )}
                                                {showItems && (
                                                    <button
                                                        onClick={() => {
                                                            setModal(null);
                                                            setSortModal({
                                                                type: 'items',
                                                                parentId: modal.type === 'category' ? modal.data.id : modal.parentId,
                                                                subId: modal.type === 'subcategory' ? modal.data.id : undefined,
                                                                items: modal.data.items.map((i: any) => ({ id: i.id, name: i.name }))
                                                            });
                                                        }}
                                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
                                                    >
                                                        <ArrowUpDown size={14} /> Artikel sortieren
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()
                            )}

                            <div className="flex gap-3 mt-6">
                                {modal.mode === 'edit' && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Möchten Sie dieses Element wirklich löschen?')) {
                                                if (modal.type === 'category') deleteCategory(modal.data.id as string);
                                                else if (modal.type === 'subcategory') deleteSubcategory(modal.parentId as string, modal.data.id as string);
                                                else if (modal.type === 'item') deleteItem(modal.parentId as string, modal.data.id as string, modal.grandParentId);
                                                setModal(null);
                                            }
                                        }}
                                        className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 font-bold uppercase tracking-widest rounded hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    className={`${modal.mode === 'edit' ? 'flex-[2]' : 'w-full'} py-3 bg-secondary text-black font-bold uppercase tracking-widest rounded hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2`}
                                >
                                    <Save size={16} /> Speichern
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global FAB */}
            <div className="fixed bottom-8 right-8 z-[150]">
                {showAddMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-[#111] border border-white/10 shadow-2xl flex flex-col min-w-[200px] overflow-hidden">
                        <button
                            onClick={() => {
                                setModal({ type: 'category', mode: 'add', data: { name: '', is_special: false, is_hidden: false, bg_color: '#000000', badge_text: 'Spezial' } });
                                setShowAddMenu(false);
                            }}
                            className="flex items-center gap-3 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-300 hover:text-black hover:bg-secondary transition-all border-b border-white/5 text-left"
                        >
                            <Plus size={16} /> Kategorie
                        </button>
                        {categories.length > 0 && (
                            <>
                                <button
                                    onClick={() => {
                                        setModal({ type: 'subcategory', mode: 'add', data: { name: '' }, parentId: categories[0].id });
                                        setShowAddMenu(false);
                                    }}
                                    className="flex items-center gap-3 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-300 hover:text-black hover:bg-secondary transition-all border-b border-white/5 text-left"
                                >
                                    <FolderPlus size={16} /> Unterkategorie
                                </button>
                                <button
                                    onClick={() => {
                                        setModal({ type: 'item', mode: 'add', data: { name: '', price: 0, unit: '', info: '', allergens: '', subcategory_id: '' }, parentId: categories[0].id });
                                        setShowAddMenu(false);
                                    }}
                                    className="flex items-center gap-3 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-300 hover:text-black hover:bg-secondary transition-all text-left"
                                >
                                    <FilePlus size={16} /> Artikel
                                </button>
                            </>
                        )}
                    </div>
                )}
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 border border-white/10 ${showAddMenu ? 'bg-secondary text-black' : 'bg-white/5 text-secondary hover:bg-secondary hover:text-black'}`}
                >
                    <Plus size={28} />
                </button>
            </div>

            {sortModal && (
                <SortOrderModal
                    {...sortModal}
                    onClose={() => setSortModal(null)}
                    onSave={handleSortSave}
                />
            )}
        </div>
    );
};

const SortableCategory = ({
    category, onEdit, onEditItem, onDeleteItem, onEditSubcategory, onEditSubItem, onDeleteSubItem, onToggleVisibility, setModal, setSortModal
}: {
    category: Category, onEdit: () => void, onEditItem: (i: MenuItem) => void, onDeleteItem: (id: string, subId?: string) => void, onEditSubcategory: (s: SubCategory) => void, onEditSubItem: (item: MenuItem, subId: string) => void, onDeleteSubItem: (itemId: string, subId: string) => void, onToggleVisibility: () => void, setModal: (modal: any) => void, setSortModal: (modal: any) => void
}) => {
    const [showActions, setShowActions] = useState(false);

    const color = category.bg_color || '#ffe08a';
    const dynamicStyle = {
        backgroundColor: category.is_special ? (category.is_hidden ? '#33333310' : color + '15') : (category.is_hidden ? '#22222210' : '#ffffff05'),
        borderColor: category.is_special ? (category.is_hidden ? '#44444430' : color + '30') : (category.is_hidden ? '#33333330' : '#ffffff10'),
        boxShadow: category.is_special && !category.is_hidden ? `0 0 40px ${color}15` : 'none',
        opacity: category.is_hidden ? 0.6 : 1
    };

    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const hasDirectItems = category.items && category.items.length > 0;

    return (
        <div style={dynamicStyle} className="p-4 sm:p-6 rounded-none border transition-all duration-300 relative group">
            <div className="flex items-start gap-1 sm:gap-4">

                <div className="flex-grow flex flex-col gap-4">
                    {/* Header: Title on Top for Mobile, Desktop Responsive */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 truncate">
                            <span className="text-base sm:text-xl font-bold uppercase tracking-tight leading-none text-white truncate">
                                {category.name}
                            </span>
                            {!!category.is_special && (
                                <span className="hidden lg:inline-flex text-[10px] text-black bg-secondary px-2 py-0.5 rounded-none uppercase tracking-wider font-semibold flex-shrink-0">
                                    {category.badge_text || 'Spezial'}
                                </span>
                            )}
                        </div>

                        {/* Mobile: Second Row for Badge, Counts, Add Item, Menu. Desktop: Inline */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto h-[32px]">
                            <div className="flex items-center gap-2 h-full">
                                {!!category.is_special && (
                                    <span className="lg:hidden text-[10px] text-black bg-secondary px-2 py-0.5 rounded-none uppercase tracking-wider font-semibold flex-shrink-0">
                                        {category.badge_text || 'Spezial'}
                                    </span>
                                )}

                                {hasSubcategories && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 bg-white/5 px-2 rounded border border-white/10 h-full" title="Unterkategorien">
                                        <Layers size={12} />
                                        <span className="hidden lg:inline">{category.subcategories?.length} {category.subcategories?.length === 1 ? 'Unterkategorie' : 'Unterkategorien'}</span>
                                        <span className="lg:hidden">{category.subcategories?.length}</span>
                                    </div>
                                )}
                                {(hasSubcategories || hasDirectItems) && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 bg-white/5 px-2 rounded border border-white/10 h-full" title="Gesamtartikel">
                                        <FileText size={12} />
                                        <span className="hidden lg:inline">{(category.items?.length || 0) + (category.subcategories?.reduce((acc, sub) => acc + (sub.items?.length || 0), 0) || 0)} Artikel</span>
                                        <span className="lg:hidden">{(category.items?.length || 0) + (category.subcategories?.reduce((acc, sub) => acc + (sub.items?.length || 0), 0) || 0)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions: Mobile/Tablet Toggle */}
                            <div className="lg:hidden relative h-full">
                                <button
                                    onClick={() => setShowActions(!showActions)}
                                    className={`w-10 h-full flex items-center justify-center transition-all ${showActions ? 'bg-secondary text-black' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                                >
                                    <MoreHorizontal size={18} />
                                </button>

                                {showActions && (
                                    <div className="absolute right-0 top-full mt-2 z-[100] bg-[#111] border border-white/10 shadow-2xl flex flex-col min-w-[180px]">
                                        <button onClick={() => { onToggleVisibility(); setShowActions(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:bg-white/5 border-b border-white/5 transition-colors">
                                            {category.is_hidden ? <><Eye size={16} className="text-secondary" /> Einblenden</> : <><EyeOff size={16} /> Ausblenden</>}
                                        </button>
                                        <button onClick={() => { onEdit(); setShowActions(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                            <Edit2 size={16} /> Bearbeiten
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Actions Row */}
                            <div className="hidden lg:flex items-center gap-2 h-full">
                                <button onClick={onToggleVisibility} className="w-10 h-full flex items-center justify-center bg-white/5 border border-white/10 text-gray-500 hover:text-secondary hover:border-secondary/30 transition-all" title={category.is_hidden ? "Einblenden" : "Ausblenden"}>
                                    {category.is_hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button onClick={onEdit} className="w-10 h-full flex items-center justify-center bg-white/5 border border-white/10 text-gray-500 hover:text-secondary hover:border-secondary/30 transition-all" title="Kategorie bearbeiten"><Edit2 size={18} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Content: Aligned flush with title, removed lines on mobile */}
                    <div className="mt-0">
                        <div className="space-y-4 pt-2">
                            {hasSubcategories && (
                                <div className="space-y-4">
                                    {category.subcategories?.map(sub => (
                                        <SubCategoryBox
                                            key={sub.id}
                                            subcategory={sub}
                                            categoryId={category.id}
                                            onEdit={() => onEditSubcategory(sub)}
                                            onEditItem={(item) => onEditSubItem(item, sub.id)}
                                            onDeleteItem={(itemId) => onDeleteSubItem(itemId, sub.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            <div>
                                <div>
                                    {hasDirectItems && (
                                        <div className="pt-2">
                                            <div className="flex flex-col gap-2">
                                                {category.items.map(item => (
                                                    <SortableItem
                                                        key={item.id}
                                                        item={item}
                                                        onEdit={() => onEditItem(item)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {!hasDirectItems && !hasSubcategories && (
                                        <p className="text-[10px] text-gray-600 italic pt-2">Noch keine Artikel vorhanden.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SubCategoryBox = ({ subcategory, categoryId, onEdit, onEditItem, onDeleteItem }: {
    subcategory: SubCategory, categoryId: string, onEdit: () => void, onEditItem: (i: MenuItem) => void, onDeleteItem: (id: string) => void
}) => {
    const hasItems = subcategory.items && subcategory.items.length > 0;

    return (
        <div className="bg-black/20 border border-white/5 rounded-none p-3 sm:p-4">
            <div className="flex items-start gap-2">

                <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 pr-2 min-w-0">
                            <span className="text-white font-bold text-sm uppercase tracking-wide truncate">{subcategory.name}</span>
                            <div className="flex items-center gap-1.5 text-[9px] text-white/40 bg-white/5 px-2 py-1 rounded border border-white/10 w-fit shrink-0" title="Artikel">
                                <FileText size={10} />
                                <span>{subcategory.items?.length || 0}</span>
                            </div>
                        </div>
                        <div className="flex items-center shrink-0 h-8 self-start sm:self-auto">
                            <button onClick={onEdit} className="h-full px-3 text-gray-400 hover:text-secondary bg-white/5 border border-white/10 transition-colors flex items-center justify-center" title="Bearbeiten"><Edit2 size={14} /></button>
                        </div>
                    </div>

                    <div>
                        <div>
                            {hasItems ? (
                                <div className="pt-2">
                                    <div className="flex flex-col gap-2">
                                        {subcategory.items.map(item => (
                                            <SortableItem
                                                key={item.id}
                                                item={item}
                                                onEdit={() => onEditItem(item)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[9px] text-gray-600 italic pt-2">Keine Artikel</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SortableItem = ({ item, onEdit }: {
    item: MenuItem, onEdit: () => void
}) => {
    return (
        <div className="flex items-start gap-1 p-3 bg-black/40 rounded-none border border-white/5 group hover:border-secondary/20 transition-all">
            <div className="flex-grow flex items-center justify-between min-w-0">
                <div className="flex flex-col min-w-0">
                    <h4 className="text-white font-bold text-xs truncate uppercase tracking-wide">{item.name}</h4>
                    <p className="text-[9px] text-gray-600 italic truncate">{item.info || 'Keine Info'}</p>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0 h-7">
                    {item.unit && (
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{item.unit}</span>
                    )}
                    <span className="text-secondary font-bold text-xs min-w-[50px] text-right">
                        {typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price as string).toFixed(2)}€
                    </span>
                    <div className="flex items-center gap-1 h-full">
                        <button onClick={onEdit} className="h-full px-2 text-gray-300 hover:text-secondary bg-white/5 border border-white/10 transition-all"><Edit2 size={12} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SortOrderModal = ({ type, items, onClose, onSave }: {
    type: 'categories' | 'subcategories' | 'items',
    items: { id: string, name: string }[],
    onClose: () => void,
    onSave: (newOrderIds: string[]) => void
}) => {
    const [localItems, setLocalItems] = useState(items);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const oldIndex = localItems.findIndex((i) => i.id === active.id);
            const newIndex = localItems.findIndex((i) => i.id === over.id);
            setLocalItems(arrayMove(localItems, oldIndex, newIndex));
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-lg p-8 shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-secondary">
                        Sortieren
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-6 font-bold">
                    {type === 'categories' ? 'Kategorien' : type === 'subcategories' ? 'Unterkategorien' : 'Artikel'} durch Ziehen sortieren
                </p>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar mb-8">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={localItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {localItems.map((item) => (
                                    <SortableOrderItem key={item.id} id={item.id} name={item.name} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="flex gap-3 mt-auto shrink-0 pt-6 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/5 text-gray-400 font-bold uppercase tracking-widest rounded hover:bg-white/10 transition-all active:scale-95"
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={() => onSave(localItems.map(i => i.id))}
                        className="flex-1 py-3 bg-secondary text-black font-bold uppercase tracking-widest rounded hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Save size={16} /> Speichern
                    </button>
                </div>
            </div>
        </div>
    );
};

const SortableOrderItem = ({ id, name }: { id: string, name: string }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 p-4 bg-white/5 border ${isDragging ? 'border-secondary bg-secondary/10' : 'border-white/10'} transition-all`}
        >
            <button {...attributes} {...listeners} className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing shrink-0">
                <GripVertical size={18} />
            </button>
            <span className="text-sm text-white font-bold uppercase tracking-wide truncate">{name}</span>
        </div>
    );
};

export default MenuManager;
