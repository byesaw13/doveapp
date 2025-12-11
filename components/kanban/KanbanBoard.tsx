'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';

export interface KanbanColumn<T> {
  id: string;
  title: string;
  items: T[];
  color?: string;
}

interface KanbanBoardProps<T extends { id: string; status: string }> {
  columns: KanbanColumn<T>[];
  onItemMove: (itemId: string, newStatus: string) => Promise<void>;
  renderCard: (item: T) => React.ReactNode;
  loading?: boolean;
}

export default function KanbanBoard<T extends { id: string; status: string }>({
  columns: initialColumns,
  onItemMove,
  renderCard,
  loading = false,
}: KanbanBoardProps<T>) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update columns when initialColumns change
  useState(() => {
    setColumns(initialColumns);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findColumn = (id: string) => {
    return columns.find((col) => col.items.some((item) => item.id === id));
  };

  const findItem = (id: string) => {
    for (const column of columns) {
      const item = column.items.find((item) => item.id === id);
      if (item) return item;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which columns the active and over items are in
    const activeColumn = findColumn(activeId);
    const overColumn =
      columns.find((col) => col.id === overId) || findColumn(overId);

    if (!activeColumn || !overColumn) return;
    if (activeColumn.id === overColumn.id) return;

    setColumns((cols) => {
      const activeItems =
        cols.find((col) => col.id === activeColumn.id)?.items || [];
      const overItems =
        cols.find((col) => col.id === overColumn.id)?.items || [];

      const activeIndex = activeItems.findIndex((item) => item.id === activeId);
      const activeItem = activeItems[activeIndex];

      if (!activeItem) return cols;

      // Remove from active column
      const newActiveItems = activeItems.filter((item) => item.id !== activeId);

      // Add to over column
      const overIndex = overItems.findIndex((item) => item.id === overId);
      const newOverItems =
        overIndex >= 0
          ? [
              ...overItems.slice(0, overIndex),
              activeItem,
              ...overItems.slice(overIndex),
            ]
          : [...overItems, activeItem];

      return cols.map((col) => {
        if (col.id === activeColumn.id) {
          return { ...col, items: newActiveItems };
        }
        if (col.id === overColumn.id) {
          return { ...col, items: newOverItems };
        }
        return col;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn =
      columns.find((col) => col.id === overId) || findColumn(overId);

    if (!activeColumn || !overColumn) return;

    // Call the API to update the status
    if (activeColumn.id !== overColumn.id) {
      try {
        await onItemMove(activeId, overColumn.id);
      } catch (error) {
        console.error('Failed to move item:', error);
        // Revert on error
        setColumns(initialColumns);
      }
    }
  };

  const activeItem = activeId ? findItem(activeId) : null;

  if (loading) {
    return (
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-slate-100 rounded-lg p-4 animate-pulse"
          >
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-24 bg-slate-200 rounded"></div>
              <div className="h-24 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            renderCard={renderCard}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90 rotate-3 scale-105 cursor-grabbing">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
