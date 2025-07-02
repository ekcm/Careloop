'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Task } from '@/lib/typing';
import ProgressBar from '@/components/ProgressBar';
import Header from '@/components/Header';
import TaskItem from '@/components/TaskItem';
import AddTask from '@/components/AddTask';

const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];

const startingTasks: Task[] = [
  {
    id: '1',
    date: yesterday,
    time: '08:00',
    label: 'Morning Medication',
    icon: 'medication',
    completed: true,
  },
  {
    id: '2',
    date: yesterday,
    time: '12:00',
    label: 'Doctor Visit',
    icon: 'doctor_visit',
    completed: true,
  },

  {
    id: '3',
    date: today,
    time: '09:00',
    label: 'Prepare Breakfast',
    icon: 'meal',
    completed: false,
  },
  {
    id: '4',
    date: today,
    time: '14:00',
    label: 'Shower Assistance',
    icon: 'bath',
    completed: false,
  },
  {
    id: '5',
    date: today,
    time: '17:00',
    label: 'Evening Walk',
    icon: 'walk',
    completed: false,
  },

  {
    id: '6',
    date: tomorrow,
    time: '08:00',
    label: 'Hydration Reminder',
    icon: 'hydrate',
    completed: false,
  },
  {
    id: '7',
    date: tomorrow,
    time: '10:00',
    label: 'Laundry',
    icon: 'laundry',
    completed: false,
  },
  {
    id: '8',
    date: tomorrow,
    time: '16:00',
    label: 'Grocery Shopping',
    icon: 'groceries',
    completed: false,
  },
];

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(startingTasks);

  const toggleTask = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

  const handleAddTask = (task: Task) => setTasks((prev) => [...prev, task]);

  const handleDeleteTask = (id: string) =>
    setTasks((prev) => prev.filter((task) => task.id !== id));

  const sortTasks = (list: Task[]) =>
    [...list].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });

  // Split tasks by date
  const pastTasks = sortTasks(tasks.filter((task) => task.date < today));
  const todaysTasks = sortTasks(tasks.filter((task) => task.date === today));
  const futureTasks = sortTasks(tasks.filter((task) => task.date > today));

  const renderTaskSection = (title: string, tasksList: Task[]) => (
    <>
      <h3 className="font-semibold mt-6 mb-3">{title}</h3>
      <div className="space-y-3">
        <AnimatePresence>
          {tasksList.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <TaskItem
                {...task}
                onToggle={toggleTask}
                onDelete={handleDeleteTask}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <div className="p-4 pb-20">
      <Header />
      <ProgressBar tasks={todaysTasks} />
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Today&apos;s Tasks</h3>
        <AddTask onAdd={handleAddTask} />
      </div>

      {todaysTasks.length > 0 && renderTaskSection('', todaysTasks)}
      {futureTasks.length > 0 && renderTaskSection('Future Tasks', futureTasks)}
      {pastTasks.length > 0 && renderTaskSection('Past Tasks', pastTasks)}
    </div>
  );
}
