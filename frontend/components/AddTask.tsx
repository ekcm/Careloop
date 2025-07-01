"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { taskIconMap, type Task } from "@/lib/typing";

interface AddTaskProps {
  onAdd: (task: Task) => void;
}

export default function AddTask({ onAdd }: AddTaskProps) {
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    label: "",
    time: "",
    icon: "pill",
    date: new Date(),
  });

  const addTask = () => {
    if (!newTask.label.trim() || !newTask.time) return;

    const task: Task = {
      id: String(Date.now()),
      completed: false,
      label: newTask.label,
      time: newTask.time,
      icon: newTask.icon,
      date: format(newTask.date, "yyyy-MM-dd"),
    };

    onAdd(task);
    setNewTask({ label: "", time: "", icon: "pill", date: new Date() });
    toast.success("Task added successfully", { id: "task-added-success" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium">Icon</p>
            <RadioGroup
              value={newTask.icon}
              onValueChange={(value) => setNewTask((t) => ({ ...t, icon: value }))}
              className="grid grid-cols-5 gap-3"
            >
              {Object.entries(taskIconMap).map(([key]) => (
                <RadioGroupItem key={key} value={key} className="peer sr-only" />
              ))}
              {Object.entries(taskIconMap).map(([key, IconNode]) => (
                <label
                  key={key}
                  htmlFor={key}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                    newTask.icon === key
                      ? "bg-primary/10 border-primary"
                      : "bg-muted hover:bg-muted/60"
                  }`}
                  onClick={() => setNewTask((t) => ({ ...t, icon: key }))}
                >
                  {IconNode}
                </label>
              ))}
            </RadioGroup>
          </div>
          <Input
            placeholder="Label"
            value={newTask.label}
            onChange={(e) => setNewTask((t) => ({ ...t, label: e.target.value }))}
          />
          <div>
            <p className="mb-1 text-sm font-medium">Date</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {newTask.date ? format(newTask.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newTask.date}
                  onSelect={(date) => date && setNewTask((t) => ({ ...t, date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Time</p>
            <Input
              type="time"
              value={newTask.time}
              onChange={(e) => setNewTask((t) => ({ ...t, time: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
            <Button
            onClick={addTask}
            disabled={!newTask.label.trim() || !newTask.time}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            >
            Save Task
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
