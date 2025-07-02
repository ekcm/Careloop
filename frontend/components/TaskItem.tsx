"use client";

import { CheckCircle2, Clock, CalendarDays, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/typing";
import { taskIconMap } from "@/lib/typing";
import { useState } from "react";

type TaskItemProps = Task & {
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function TaskItem({
  id,
  label,
  time,
  date,
  icon,
  completed,
  onToggle,
  onDelete,
}: TaskItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    onDelete?.(id);
    setShowConfirm(false);
  };

  return (
    <div
      onClick={() => onToggle?.(id)}
      className={cn(
        "flex justify-between items-center p-3 rounded-xl shadow-sm cursor-pointer relative",
        completed ? "bg-blue-50 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {taskIconMap[icon]}
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium break-words",
              completed && "line-through text-muted-foreground"
            )}
          >
            {label}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {date}
            </p>
            <p className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {time}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle2
          className={cn(
            "w-7 h-7 transition-colors",
            completed ? "text-blue-500" : "text-gray-300"
          )}
        />
        <button
          type="button"
          onClick={handleDelete}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Delete task"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-lg flex flex-col items-center gap-3">
            <p className="text-sm">Are you sure you want to delete this task?</p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete();
                }}
                className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-zinc-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
