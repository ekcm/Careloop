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
import { useT } from '@/hooks/useTranslation';
import { taskIconMap } from '@/lib/typing';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const [icon, setIcon] = useState('');

  // Translation hooks
  const addTaskText = useT('Add Task');
  const addNewTaskText = useT('Add New Task');
  const dateText = useT('Date');
  const timeText = useT('Time');
  const pickDateText = useT('Pick a date');
  const labelHeaderText = useT('Label');
  const taskLabelText = useT('Task Label (e.g., Finish report)');
  const notesText = useT('Notes (optional)');
  const rewardText = useT('Reward (optional)');
  const saveTaskText = useT('Save Task');
  const validationErrorText = useT(
    'Please fill in the task label, date, and time.'
  );
  const taskAddedText = useT('Task added successfully!');

  const resetForm = () => {
    setLabel('');
    setNotes('');
    setReward('');
    setDate(new Date());
    setTime('');
    setIcon('');
  };

  const handleAddTask = () => {
    // Basic validation
    if (!label.trim() || !date || !time) {
      toast.error(validationErrorText);
      return;
    }

    // Create the ISO string by explicitly adding 'Z' to signify UTC.
    // This prevents the browser from performing any timezone conversion.
    // The date and time selected by the user are preserved as they are.
    const combinedDateTime = `${format(date, 'yyyy-MM-dd')}T${time}:00Z`;

    const taskToAdd: Omit<NewTodo, 'user_id' | 'group_id' | 'date_and_time'> & {
      date_and_time: string;
    } = {
      label,
      date_and_time: combinedDateTime,
      notes: notes.trim() || null,
      reward: reward.trim() || null,
      icon: icon || 'checklist',
    };

    onAdd(taskToAdd);
    toast.success(taskAddedText);
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" /> {addTaskText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{addNewTaskText}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-medium">Icon</p>
            <RadioGroup
              value={icon}
              onValueChange={(value) => setIcon(value)}
              className="grid grid-cols-5 gap-3"
            >
              {Object.entries(taskIconMap).map(([key]) => (
                <RadioGroupItem
                  key={key}
                  value={key}
                  className="peer sr-only"
                />
              ))}
              {Object.entries(taskIconMap).map(([key, IconNode]) => (
                <label
                  key={key}
                  htmlFor={key}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                    icon === key
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted hover:bg-muted/60'
                  }`}
                  onClick={() => setIcon(key)}
                >
                  {IconNode}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
        <div className="space-y-4 py-2">
          <p className="mb-1 text-sm font-medium">{labelHeaderText}</p>
          {/* Task Label Input */}
          <Input
            placeholder={taskLabelText}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          {/* Date Picker */}
          <div>
            <p className="mb-1 text-sm font-medium">{dateText}</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {date ? format(date, 'PPP') : pickDateText}
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
            <p className="mb-1 text-sm font-medium">{timeText}</p>
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
              placeholder={notesText}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="pl-10 w-full border rounded-md px-3 py-2 text-sm shadow-sm min-h-[80px]"
            />
          </div>

          {/* Optional Reward Input */}
          <div className="relative">
            <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={rewardText}
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
            {saveTaskText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
