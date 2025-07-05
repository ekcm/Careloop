'use client';

import { useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import FireworksAnimation from './FireworksAnimation';
import { Todo } from '@/apis/supabaseApi';
import { useT } from '@/hooks/useTranslation';
import useUser from '@/hooks/useUser';

const encouragementMessages = [
  'Thank you for your loving care for Grandma, {{userName}}. You’re truly appreciated! 🌸',
  'Your kindness and dedication to Grandma make all the difference, {{userName}}. Thank you! 🙏',
  'Grandma is lucky to have you, {{userName}}, looking after her with such warmth and care. ❤️',
  'Thank you for being such a wonderful helper to Grandma, {{userName}}. Your efforts don’t go unnoticed! 🫶',
  'Your hard work and compassion mean the world to Grandma and all of us, {{userName}}. Thank you! 🌼',
  'With your care, Grandma feels safe and loved every day, {{userName}}. Thank you so much! 🤗',
  'We’re grateful for your patience and dedication in caring for Grandma, {{userName}}. Thank you! 💕',
  'Thank you for your gentle and loving touch in looking after Grandma, {{userName}}. You’re amazing! 🌹',
  'Your support and care make Grandma’s days brighter, {{userName}}. Thank you from the bottom of our hearts! 💖',
  'Thank you for being a true blessing in Grandma’s life, {{userName}}. We appreciate you! 🌷',
];

export default function ProgressBar({ tasks }: { tasks: Todo[] }) {
  const userName = useUser()?.user?.username || 'User';
  const today = new Date().toISOString().split('T')[0];

  const todaysTasks = tasks.filter(
    (t) => t.date_and_time.split('T')[0] === today
  );

  const completedCount = todaysTasks.filter((t) => t.is_completed).length;

  const progress =
    todaysTasks.length > 0 ? (completedCount / todaysTasks.length) * 100 : 0;

  const [showFireworks, setShowFireworks] = useState(false);
  const previousProgress = useRef(progress);

  useEffect(() => {
    if (
      previousProgress.current < 100 &&
      progress === 100 &&
      todaysTasks.length > 0
    ) {
      setShowFireworks(true);
    } else {
      setShowFireworks(false);
    }
    previousProgress.current = progress;
  }, [progress, todaysTasks.length]);

  // Translation hooks
  const todaysProgressText = useT("Today's Progress");
  const tasksCompletedText = useT('of tasks completed');
  const completeText = useT('Complete');

  return (
    <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-4 mb-6 relative overflow-hidden">
      {showFireworks && (
        <FireworksAnimation
          toastText={encouragementMessages[
            Math.floor(Math.random() * encouragementMessages.length)
          ].replace('{{userName}}', userName)}
        />
      )}
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-lg font-semibold">{todaysProgressText}</p>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {completedCount} {tasksCompletedText} {todaysTasks.length}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {Math.round(progress)}%
          </span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {completeText}
          </span>
        </div>
      </div>
      <Progress
        value={progress}
        className="[&>div]:bg-blue-600 dark:[&>div]:bg-blue-400"
      />
    </div>
  );
}
