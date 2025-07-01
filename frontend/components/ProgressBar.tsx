"use client";

import { Task } from "@/lib/typing";
import { Progress } from "@/components/ui/progress";

export default function ProgressBar({ tasks }: { tasks: Task[] }) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-lg font-semibold">Today&apos;s Progress</p>
          <span className="text-sm">
            {completedCount} of {tasks.length} tasks completed
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {Math.round(progress) || 0}%
          </span>
          <span className="text-sm font-semibold">Complete</span>
        </div>
      </div>
      <Progress
        value={progress}
        className="[&>div]:bg-blue-600 dark:[&>div]:bg-blue-400"
      />
    </div>
  );
}
