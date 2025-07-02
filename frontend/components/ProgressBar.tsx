'use client';

import { Task } from '@/lib/typing';
import { Progress } from '@/components/ui/progress';
import FireworksAnimation from './FireworksAnimation';
import { Todo } from '@/apis/supabaseApi';

const encouragementMessages = [
  'Thank you for your loving care for Grandma. You’re truly appreciated! 🌸',
  'Your kindness and dedication to Grandma make all the difference. Thank you! 🙏',
  'Grandma is lucky to have you looking after her with such warmth and care. ❤️',
  'Thank you for being such a wonderful helper to Grandma. Your efforts don’t go unnoticed! 🌟',
  'Your hard work and compassion mean the world to Grandma and all of us. Thank you! 🌼',
  'With your care, Grandma feels safe and loved every day. Thank you so much! 🤗',
  'We’re grateful for your patience and dedication in caring for Grandma. Thank you! 💕',
  'Thank you for your gentle and loving touch in looking after Grandma. You’re amazing! 🌹',
  'Your support and care make Grandma’s days brighter. Thank you from the bottom of our hearts! 💖',
  'Thank you for being a true blessing in Grandma’s life. We appreciate you! 🌷',
];

export default function ProgressBar({ tasks }: { tasks: Todo[] }) {
  const today = new Date().toISOString().split('T')[0];

  const todaysTasks = tasks.filter((t) => t.date_and_time === today);
  const completedCount = todaysTasks.filter((t) => t.is_completed).length;
  const progress = (completedCount / (todaysTasks.length || 1)) * 100;

  return (
    <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-4 mb-6 relative">
      {progress === 100 && (
        <FireworksAnimation
          toastText={
            encouragementMessages[
              Math.floor(Math.random() * encouragementMessages.length)
            ]
          }
        />
      )}
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-lg font-semibold">Today&apos;s Progress</p>
          <span className="text-sm">
            {completedCount} of {todaysTasks.length} tasks completed
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {Math.round(progress)}%
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
