"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Task } from "@/lib/typing";
import ProgressBar from "@/components/ProgressBar";
import Header from "@/components/Header";
import TaskItem from "@/components/TaskItem";

const startingTasks: Task[] = [
  { id: "1", date: "2025-07-01", time: "8:00 AM", label: "Morning Medication", icon: "pill", completed: false },
  { id: "2", date: "2025-07-01", time: "11:30 AM", label: "Prepare Lunch", icon: "utensils", completed: false },
  { id: "3", date: "2025-07-01", time: "2:00 PM", label: "Shower Assistance", icon: "showerHead", completed: false },
  { id: "4", date: "2025-07-01", time: "5:00 PM", label: "Evening Walk", icon: "footprints", completed: false },
];

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(startingTasks);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="p-4 pb-20">
      <Header />
      <ProgressBar tasks={tasks} />

      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Today&apos;s Tasks</h3>
        <Button variant="outline" size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} {...task} onToggle={toggleTask} />
        ))}
      </div>
    </div>
  );
}
