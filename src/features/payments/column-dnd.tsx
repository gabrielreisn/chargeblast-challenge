"use client";
import type { CSSProperties, ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/components/ui/styles";
import type { MoveColumn } from "./table-features";

type ColumnLabels = Record<string, string>;

type ColumnDndProviderProps = {
  /** Reorderable column ids in display order (fixed columns excluded). */
  columnIds: string[];
  labels: ColumnLabels;
  moveColumn: MoveColumn;
  children: ReactNode;
};

const screenReaderInstructions = {
  draggable:
    "To reorder a column, press space or enter to pick it up, use the left and right arrow keys to move it, then press space or enter to drop it. Press escape to cancel.",
};

function announcementsFor(labels: ColumnLabels): Announcements {
  const label = (id: UniqueIdentifier) => labels[String(id)] ?? String(id);
  return {
    onDragStart: ({ active }) => `Picked up the ${label(active.id)} column.`,
    onDragOver: ({ active, over }) =>
      over ? `The ${label(active.id)} column is over ${label(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Moved the ${label(active.id)} column to the position of ${label(over.id)}.`
        : `Dropped the ${label(active.id)} column.`,
    onDragCancel: ({ active }) => `Cancelled moving the ${label(active.id)} column.`,
  };
}

/**
 * Drag-and-drop column reordering. Headers and body cells of the same column
 * share a sortable id, so the whole column moves while neighbors slide aside.
 */
export function ColumnDndProvider({
  columnIds,
  labels,
  moveColumn,
  children,
}: ColumnDndProviderProps) {
  const sensors = useSensors(
    // A short distance keeps clicks on sort buttons and the resize handle working.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) moveColumn(String(active.id), String(over.id));
  }
  return (
    <DndContext
      // A fixed id keeps dnd-kit's generated aria ids identical on server and client.
      id="payments-column-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements: announcementsFor(labels), screenReaderInstructions }}
    >
      <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

function dragStyle(
  transform: Parameters<typeof CSS.Translate.toString>[0],
  transition: string | undefined,
  width: number,
): CSSProperties {
  // Runtime geometry from dnd-kit and TanStack: the documented inline-style exception.
  return { width, transform: CSS.Translate.toString(transform), transition };
}

const draggingStyles = "z-10 bg-white opacity-90 shadow-[0_2px_8px_#25354f26]";

type SortableHeaderCellProps = {
  columnId: string;
  label: string;
  width: number;
  className: string;
  ariaSort: "ascending" | "descending" | "none" | undefined;
  children: ReactNode;
};

export function SortableHeaderCell({
  columnId,
  label,
  width,
  className,
  ariaSort,
  children,
}: SortableHeaderCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnId });
  return (
    <th
      ref={setNodeRef}
      aria-sort={ariaSort}
      style={dragStyle(transform, transition, width)}
      className={cn(className, "cursor-grab", isDragging && cn(draggingStyles, "cursor-grabbing"))}
      // Pointer drags start anywhere on the header; the keyboard uses the grip below.
      onPointerDown={(event) => listeners?.onPointerDown?.(event)}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        onKeyDown={(event) => listeners?.onKeyDown?.(event)}
        aria-label={`Reorder ${label} column`}
        className={cn(
          "absolute top-1/2 left-0 flex h-4 w-2.5 -translate-y-1/2 cursor-grab items-center justify-center rounded-sm text-[#a3acb9] opacity-0 group-hover/th:opacity-100 focus-visible:opacity-100",
          isDragging && "opacity-100",
        )}
      >
        <GripVertical size={11} aria-hidden="true" />
      </button>
      {children}
    </th>
  );
}

type SortableCellProps = {
  columnId: string;
  width: number;
  className: string;
  children: ReactNode;
};

/** Body cell that moves with its column's header while dragging. */
export function SortableCell({ columnId, width, className, children }: SortableCellProps) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id: columnId });
  return (
    <td
      ref={setNodeRef}
      style={dragStyle(transform, transition, width)}
      className={cn(className, "relative", isDragging && draggingStyles)}
    >
      {children}
    </td>
  );
}
