"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
    id: string;
    name: string;
    onRemove: () => void;
}

export default function SortableItem({ id, name, onRemove }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
            className="flex justify-between items-center p-2 bg-white text-black shadow-md rounded mb-2 cursor-grab"
        >
            <span>{name}</span>
            <button onClick={onRemove} className="text-red-500">❌</button>
        </li>
    );
}
