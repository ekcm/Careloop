'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Todo } from '@/apis/supabaseApi';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useT } from '@/hooks/useTranslation';

interface TaskDisplayProps {
  todaysTasks: Todo[];
  futureTasks: Todo[];
  pastTasks: Todo[];
  renderTaskSection: (title: string, tasksList: Todo[]) => React.ReactNode;
  todaysTasksText: string;
  futureTasksText: string;
  pastTasksText: string;
}

export default function TaskDisplay({
  todaysTasks,
  futureTasks,
  pastTasks,
  renderTaskSection,
  todaysTasksText,
  futureTasksText,
  pastTasksText,
}: TaskDisplayProps) {
  const todayText = useT('Today');
  const futureText = useT('Future');
  const pastText = useT('Past');

  return (
    <Tabs defaultValue={todayText} className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value={todayText} className="w-full" defaultChecked>
          {todaysTasksText} ({todaysTasks.length})
        </TabsTrigger>
        <TabsTrigger value={futureText} className="w-full">
          {futureTasksText} ({futureTasks.length})
        </TabsTrigger>
        <TabsTrigger value={pastText} className="w-full">
          {pastTasksText} ({pastTasks.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value={todayText}>
        <AnimatePresence mode="wait">
          <motion.div
            key={todayText}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTaskSection('', todaysTasks)}
          </motion.div>
        </AnimatePresence>
      </TabsContent>

      <TabsContent value={futureText}>
        <AnimatePresence mode="wait">
          <motion.div
            key={futureText}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTaskSection('', futureTasks)}
          </motion.div>
        </AnimatePresence>
      </TabsContent>

      <TabsContent value={pastText}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pastText}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTaskSection('', pastTasks)}
          </motion.div>
        </AnimatePresence>
      </TabsContent>
    </Tabs>
  );
}
