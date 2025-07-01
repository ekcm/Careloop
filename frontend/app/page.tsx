"use client";

import { useState } from "react";
import { type Task } from "@/lib/typing";
import ProgressBar from "@/components/ProgressBar";
import Header from "@/components/Header";
import TaskItem from "@/components/TaskItem";
import AddTask from "@/components/AddTask";

const startingTasks: Task[] = [
  { id: "1", date: "2025-07-01", time: "08:00", label: "Morning Medication", icon: "pill", completed: false },
  { id: "2", date: "2025-07-01", time: "11:30", label: "Prepare Lunch", icon: "utensils", completed: false },
  { id: "3", date: "2025-07-01", time: "14:00", label: "Shower Assistance", icon: "showerHead", completed: false },
  { id: "4", date: "2025-07-01", time: "17:00", label: "Evening Walk", icon: "footprints", completed: false },
];

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(startingTasks);

  const toggleTask = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  const handleAddTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <div className="p-4 pb-20">
      <Header />
      <ProgressBar tasks={tasks} />
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Today&#39;s Tasks</h3>
        <AddTask onAdd={handleAddTask} />
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} {...task} onToggle={toggleTask} onDelete={handleDeleteTask} />
        ))}
      </div>
    </div>
  );
}
