'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Todo } from '@/apis/supabaseApi';

interface TaskDisplayProps {
  todaysTasks: Todo[];
  futureTasks: Todo[];
  pastTasks: Todo[];
  renderTaskSection: (title: string, tasksList: Todo[]) => React.ReactNode;
  todaysTasksText: string;
  futureTasksText: string;
  pastTasksText: string;
}

type ActiveTab = 'today' | 'future' | 'past';

export default function TaskDisplay({
  todaysTasks,
  futureTasks,
  pastTasks,
  renderTaskSection,
  todaysTasksText,
  futureTasksText,
  pastTasksText,
}: TaskDisplayProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');

  const tabs = {
    today: {
      label: todaysTasksText,
      count: todaysTasks.length,
      content: renderTaskSection('', todaysTasks),
    },
    future: {
      label: futureTasksText,
      count: futureTasks.length,
      content: renderTaskSection('', futureTasks),
    },
    past: {
      label: pastTasksText,
      count: pastTasks.length,
      content: renderTaskSection('', pastTasks),
    },
  };

  return (
    <div>
      <div className="border-b border-gray-200 justify-items-center">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {Object.keys(tabs).map((tabKey) => {
            const tab = tabs[tabKey as ActiveTab];
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tabKey as ActiveTab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </nav>
      </div>
      <div className="pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tabs[activeTab].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
