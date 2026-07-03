import React from "react";
import { useQuery, useMutation } from "convex/react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../convex/_generated/api";
import { Doc, Id } from "../convex/_generated/dataModel";
import { GripIcon, PlusIcon, TrashIcon } from "./icons";
import { useToast } from "../lib/toast";
import { logger } from "../lib/logger";

type Task = Doc<"Tasks">;
type Priority = 1 | 2 | 3;

const PRIORITY_LABELS: Record<Priority, string> = { 1: "High", 2: "Med", 3: "Low" };

function TaskRow({ task }: { task: Task }) {
  const setDone = useMutation(api.Tasks.setDone);
  const removeTask = useMutation(api.Tasks.removeTask);
  const { toast, toastError } = useToast();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const handleToggle = async (done: boolean) => {
    try {
      await setDone({ id: task._id, done });
    } catch (err) {
      logger.error("setDone failed", err);
      toastError("Couldn't update the task. Try again.");
    }
  };

  const handleDelete = async () => {
    try {
      await removeTask({ id: task._id });
      toast("Task deleted");
    } catch (err) {
      logger.error("removeTask failed", err);
      toastError("Couldn't delete the task. Try again.");
    }
  };

  return (
    <li
      ref={setNodeRef}
      className={`task-row${task.done ? " task-row--done" : ""}${isDragging ? " task-row--dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        className="icon-btn task-row__handle"
        aria-label={`Reorder task: ${task.taskDescription}`}
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <input
        type="checkbox"
        className="task-check"
        checked={task.done}
        onChange={(e) => void handleToggle(e.target.checked)}
        aria-label={`Mark "${task.taskDescription}" ${task.done ? "not done" : "done"}`}
      />
      <span className="task-row__text">{task.taskDescription}</span>
      <span className={`prio prio--${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
      <button className="icon-btn icon-btn--danger" aria-label="Delete task" onClick={() => void handleDelete()}>
        <TrashIcon />
      </button>
    </li>
  );
}

export function TaskList({ cardId }: { cardId: Id<"Cards"> }) {
  const tasks = useQuery(api.Tasks.getTasks, { cardId });
  const addTask = useMutation(api.Tasks.addTask);
  const setOrder = useMutation(api.Tasks.setOrder).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.Tasks.getTasks, { cardId });
    if (current === undefined) return;
    const orderById = new Map(args.updates.map((u) => [u.id, u.order]));
    const next = current
      .map((t) => ({ ...t, order: orderById.get(t._id) ?? t.order }))
      .sort((a, b) => a.order - b.order);
    localStore.setQuery(api.Tasks.getTasks, { cardId }, next);
  });

  const { toastError } = useToast();
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>(2);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    // Keyboard path: focus a task's grip, Space/Enter to lift, arrows to move.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const doneCount = tasks?.filter((t) => t.done).length ?? 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    try {
      await addTask({ cardId, taskDescription: description.trim(), priority });
      setDescription("");
    } catch (err) {
      logger.error("addTask failed", err);
      toastError("Couldn't add the task. Try again.");
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!tasks || !e.over || e.active.id === e.over.id) return;
    const oldIndex = tasks.findIndex((t) => t._id === e.active.id);
    const newIndex = tasks.findIndex((t) => t._id === e.over!.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    void setOrder({
      updates: reordered.map((t, i) => ({ id: t._id, order: i + 1 })),
    }).catch((err) => {
      logger.error("setOrder failed", err);
      toastError("Couldn't reorder tasks. Try again.");
    });
  };

  return (
    <section className="panel" aria-label="Tasks">
      <div className="panel__header">
        <h2 className="panel__title">Tasks</h2>
        {tasks && tasks.length > 0 && (
          <span className="panel__count">
            {doneCount}/{tasks.length} done
          </span>
        )}
      </div>
      <div className="panel__body">
        {tasks === undefined ? (
          <span className="mono" style={{ color: "var(--ink-faint)" }}>
            Loading…
          </span>
        ) : tasks.length === 0 ? (
          <div className="empty">
            <span className="empty__title">No tasks yet</span>
            <span className="empty__hint">Break the work into steps you can check off.</span>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
              <ul className="task-list">
                {tasks.map((task) => (
                  <TaskRow key={task._id} task={task} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        <form className="add-row" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Add a task…"
            aria-label="New task description"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            aria-label="Priority"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as Priority)}
          >
            <option value={1}>High</option>
            <option value={2}>Med</option>
            <option value={3}>Low</option>
          </select>
          <button type="submit" className="btn" disabled={!description.trim()}>
            <PlusIcon /> Add
          </button>
        </form>
      </div>
    </section>
  );
}
