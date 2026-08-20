'use client';

import { GripVertical } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DraggableNamedListProps = {
  items: string[];
  disabled?: boolean;
  onReorder: (from: number, to: number) => void;
  renderItem: (name: string, index: number) => ReactNode;
};

export function DraggableNamedList({
  items,
  disabled = false,
  onReorder,
  renderItem,
}: DraggableNamedListProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);

  const onPointerDown = (index: number, event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(index);
    setOver(index);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragging == null) return;
    const y = event.clientY;
    let next = dragging;
    rowRefs.current.forEach((row, index) => {
      if (!row) return;
      const rect = row.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (y < mid && index <= dragging) next = index;
      if (y >= mid && index >= dragging) next = index;
    });
    setOver(next);
  };

  const endDrag = () => {
    if (dragging != null && over != null && dragging !== over) {
      onReorder(dragging, over);
    }
    setDragging(null);
    setOver(null);
  };

  return (
    <>
      {items.map((name, index) => (
        <li
          key={name}
          ref={(node) => {
            rowRefs.current[index] = node;
          }}
          className={cn(
            'flex items-center gap-1 px-2 py-2 text-sm',
            dragging === index && 'opacity-60',
            over === index && dragging != null && dragging !== index && 'bg-primary/10',
          )}
        >
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground touch-none shrink-0 cursor-grab rounded-md p-1 active:cursor-grabbing disabled:opacity-30"
            aria-label={`Drag ${name}`}
            disabled={disabled}
            onPointerDown={(event) => onPointerDown(index, event)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <GripVertical className="size-4" />
          </button>
          {renderItem(name, index)}
        </li>
      ))}
    </>
  );
}
