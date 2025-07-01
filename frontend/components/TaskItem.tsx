"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/typing";
import { taskIconMap } from "@/lib/typing";

type TaskItemProps = Task & {
  onToggle?: (id: string) => void;
};

export default function TaskItem({
  id,
  label,
  time,
  icon,
  completed,
  onToggle,
}: TaskItemProps) {
  return (
    <div
      onClick={() => onToggle?.(id)}
      className={cn(
        "flex justify-between items-center p-3 rounded-xl shadow-sm cursor-pointer",
        completed ? "bg-blue-50 dark:bg-zinc-800" : "bg-white dark:bg-zinc-900"
      )}
    >
      <div className="flex items-center gap-3">
        {taskIconMap[icon]}
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              completed && "line-through text-muted-foreground"
            )}
          >
            {label}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {time}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle2
          className={cn(
            "w-7 h-7 transition-colors",
            completed ? "text-blue-500" : "text-gray-300"
            "w-7 h-7 transition-colors",
            completed ? "text-blue-500" : "text-gray-300"
          )}
        />
      </div>
    </div>
  );
}
