import React, { useState } from 'react';
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
import { GripVertical, Plus, Edit2, Trash2, Palette, Star } from 'lucide-react';

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
    const [categories, setCategories] = useState<Category[]>([
        {
            id: 'cat-1',
            name: 'Cocktails',
            is_special: true,
            bg_color: '#ffe08a',
            items: [
                { id: 'item-1', name: 'Sex on the Beach', price: 9.5, unit: '0,4l', info: 'Wodka, Pfirsich...' }
            ]
        },
        {
            id: 'cat-2',
            name: 'Softdrinks',
            is_special: false,
            bg_color: '#000000',
            items: []
        }
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setCategories((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        // Here we would sync with MySQL via PHP API
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest italic border-l-4 border-secondary pl-4">Menü-Verwaltung</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
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
                    <div className="space-y-4">
                        {categories.map((category) => (
                            <SortableCategory key={category.id} category={category} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

const SortableCategory = ({ category }: { category: Category }) => {
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
            className={`p-4 rounded-xl border ${category.is_special ? 'bg-secondary/10 border-secondary/30' : 'bg-white/[0.03] border-white/10'}`}
        >
            <div className="flex items-center gap-4">
                <button {...attributes} {...listeners} className="text-gray-600 cursor-grab active:cursor-grabbing hover:text-white transition-colors">
                    <GripVertical size={20} />
                </button>

                <div className="flex-grow flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold uppercase tracking-tight ${category.is_special ? 'text-secondary' : 'text-white'}`}>
                            {category.name}
                        </span>
                        {category.is_special && <Star size={14} className="text-secondary fill-secondary animate-pulse" />}
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-500 hover:text-secondary transition-colors"><Edit2 size={16} /></button>
                        <button className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        <div className="w-8 h-8 rounded border border-white/20 ml-4 overflow-hidden" style={{ backgroundColor: category.bg_color }}></div>
                    </div>
                </div>
            </div>

            <div className="mt-4 ml-12 border-l border-white/5 pl-6 space-y-2">
                <button className="text-[10px] uppercase font-bold text-gray-500 hover:text-secondary transition-colors flex items-center gap-2 mb-4">
                    <Plus size={12} /> Artikel hinzufügen
                </button>
                {/* Items list would go here */}
                <p className="text-xs text-gray-700 italic">Keine Artikel in dieser Kategorie</p>
            </div>
        </div>
    );
};

export default MenuManager;
