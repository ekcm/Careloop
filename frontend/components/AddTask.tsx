'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, StickyNote, Award } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { NewTodo } from '@/apis/supabaseApi';

interface AddTaskProps {
  onAdd: (task: Omit<NewTodo, 'user_id' | 'group_id'>) => void;
}

export default function AddTask({ onAdd }: AddTaskProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [reward, setReward] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('');

  /**
   * Resets all form fields to their default state.
   */
  const resetForm = () => {
    setLabel('');
    setNotes('');
    setReward('');
    setDate(new Date());
    setTime('');
  };

  /**
   * Validates the form, constructs the new task object, and calls the onAdd prop.
   */
  const handleAddTask = () => {
    // Basic validation
    if (!label.trim() || !date || !time) {
      toast.error('Please fill in the task label, date, and time.');
      return;
    }

    // Combine date and time into a single ISO string for the database
    const combinedDateTime = new Date(
      `${format(date, 'yyyy-MM-dd')}T${time}`
    ).toISOString();

    // Construct the task object to be sent to the parent component
    const taskToAdd: Omit<NewTodo, 'user_id' | 'group_id'> = {
      label,
      date_and_time: combinedDateTime,
      notes: notes.trim() || null,
      reward: reward.trim() || null,
    };

    onAdd(taskToAdd);
    toast.success('Task added successfully!');
    resetForm();
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
        <div className="space-y-4 py-2">
          {/* Task Label Input */}
          <Input
            placeholder="Task Label (e.g., Finish report)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          {/* Date Picker */}
          <div>
            <p className="mb-1 text-sm font-medium">Date</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Input */}
          <div>
            <p className="mb-1 text-sm font-medium">Time</p>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {/* Optional Notes Input */}
          <div className="relative">
             <StickyNote className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="pl-10 w-full border rounded-md px-3 py-2 text-sm shadow-sm min-h-[80px]"
            />
          </div>

          {/* Optional Reward Input */}
           <div className="relative">
             <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Reward (optional)"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleAddTask}
            disabled={!label.trim() || !time || !date}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
