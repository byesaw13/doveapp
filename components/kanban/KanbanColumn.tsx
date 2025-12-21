'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import type { KanbanColumn as KanbanColumnType } from './KanbanBoard';

interface KanbanColumnProps<T extends { id: string; status: string }> {
  column: KanbanColumnType<T>;
  renderCard: (item: T) => React.ReactNode;
}

export default function KanbanColumn<T extends { id: string; status: string }>({
  column,
  renderCard,
}: KanbanColumnProps<T>) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const itemIds = column.items.map((item) => item.id);

  return (
    <div className="flex-shrink-0 w-96 bg-slate-50 rounded-lg flex flex-col max-h-full">
      {/* Column Header */}
      <div
        className={`p-4 border-b-4 rounded-t-lg ${
          column.color || 'border-slate-300 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg">{column.title}</h3>
          <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-full">
            {column.items.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[200px]"
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {column.items.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Drop items here
            </div>
          ) : (
            column.items.map((item) => (
              <KanbanCard key={item.id} id={item.id}>
                {renderCard(item)}
              </KanbanCard>
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
