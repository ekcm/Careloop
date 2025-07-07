'use client';

import { useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Todo } from '@/apis/supabaseApi';
import { useT } from '@/hooks/useTranslation';
import useUser from '@/hooks/useUser';
import type { FireworksHandlers } from 'fireworks-js';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/* FireworksAnimation                                                 */
/* ------------------------------------------------------------------ */

type FireworksAnimationProps = {
  toastText?: string;
};

function FireworksAnimation({
  toastText = 'Great job! Keep up the good work! 🎉',
}: FireworksAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let fireworksInstance: FireworksHandlers | undefined;

    async function startFireworks() {
      const { Fireworks } = await import('fireworks-js');
      if (containerRef.current) {
        fireworksInstance = new Fireworks(containerRef.current, {
          acceleration: 1.05,
          friction: 0.97,
          gravity: 1.5,
          particles: 50,
          traceLength: 3,
          explosion: 5,
        });
        fireworksInstance.start();

        setTimeout(() => {
          toast.dismiss();
          fireworksInstance?.stop();
          toast.success(toastText, { duration: 6000 });
        }, 5000);
      }
    }

    startFireworks();
    return () => fireworksInstance?.stop();
  }, [toastText]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* ProgressBar                                                        */
/* ------------------------------------------------------------------ */

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

  const encouragementMessages = [
    useT('Thank you for your loving care for Grandma, ') +
      userName +
      useT('. You’re truly appreciated! 🌸'),
    useT('Your kindness and dedication to Grandma make all the difference, ') +
      userName +
      useT('. Thank you! 🙏'),
    useT('Grandma is lucky to have you, ') +
      userName +
      useT(', looking after her with such warmth and care. ❤️'),
    useT('Thank you for being such a wonderful helper to Grandma, ') +
      userName +
      useT('. Your efforts don’t go unnoticed! 🫶'),
    useT(
      'Your hard work and compassion mean the world to Grandma and all of us, '
    ) +
      userName +
      useT('. Thank you! 🌼'),
    useT('With your care, Grandma feels safe and loved every day, ') +
      userName +
      useT('. Thank you so much! 🤗'),
    useT(
      'We’re grateful for your patience and dedication in caring for Grandma, '
    ) +
      userName +
      useT('. Thank you! 💕'),
    useT(
      'Thank you for your gentle and loving touch in looking after Grandma, '
    ) +
      userName +
      useT('. You’re amazing! 🌹'),
    useT('Your support and care make Grandma’s days brighter, ') +
      userName +
      useT('. Thank you from the bottom of our hearts! 💖'),
    useT('Thank you for being a true blessing in Grandma’s life, ') +
      userName +
      useT('. We appreciate you! 🌷'),
  ];

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

  // i18n text
  const todaysProgressText = useT("Today's Progress");
  const tasksCompletedText = useT('of tasks completed');
  const completeText = useT('Complete');

  return (
    <div className="rounded-xl bg-blue-50 dark:bg-blue-950 p-4 mb-6 relative overflow-hidden">
      {showFireworks && (
        <FireworksAnimation
          toastText={
            encouragementMessages[
              Math.floor(Math.random() * encouragementMessages.length)
            ]
          }
        />
      )}

      {/* Header */}
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

      {/* Progress bar */}
      <Progress
        value={progress}
        className="[&>div]:bg-blue-600 dark:[&>div]:bg-blue-400"
      />
    </div>
  );
}
