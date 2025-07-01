"use client";

import { CheckCircle2 } from "lucide-react";
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
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* <Gift className="w-4 h-4 text-yellow-500" /> */}
        <CheckCircle2
          className={cn(
            "w-7 h-7 transition-colors",
            completed ? "text-blue-500" : "text-gray-300"
          )}
        />
      </div>
    </div>
  );
}
