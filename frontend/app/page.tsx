'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Todo,
  NewTodo,
  Group,
  getUserProfile,
  getGroupDetails,
  getGroupTodos,
  addTodo,
  updateTodoCompletion,
  deleteTodo,
  supabase,
} from '@/apis/supabaseApi';
import ProgressBar from '@/components/ProgressBar';
import Header from '@/components/Header';
import TaskItem from '@/components/TaskItem';
import AddTask from '@/components/AddTask';
import { Session } from '@supabase/supabase-js';
import { useT } from '@/hooks/useTranslation';

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Translation hooks
  const loadingText = useT('Loading tasks...');
  const loginText = useT('Please log in to view your tasks.');
  const welcomeText = useT('Welcome!');
  const groupNeededText = useT(
    'You need to be in a group to see and create tasks.'
  );
  const goToAccountText = useT(
    'Please go to your account page to join or create a group.'
  );
  const goToAccountLinkText = useT('Go to Account');
  const todaysTasksText = useT("Today's Tasks");
  const futureTasksText = useT('Future Tasks');
  const pastTasksText = useT('Past Tasks');
  const failedLoadText = useT('Failed to load tasks. Please try again.');
  const failedUpdateText = useT('Failed to update task.');
  const failedAddText = useT('Failed to add task.');
  const failedDeleteText = useT('Failed to delete task.');
  const groupRequiredText = useT('You must be in a group to add a task.');

  const today = getTodayString();

  /**
   * Effect hook to check for an active session and listen for auth state changes.
   */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Fetches all necessary data from Supabase: user's group and the group's todos.
   */
  const fetchData = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Get user's profile to find their group_id
      const userProfile = await getUserProfile(session.user.id);
      if (userProfile?.group_id) {
        // 2. If in a group, fetch group details
        const groupDetails = await getGroupDetails(userProfile.group_id);
        setGroup(groupDetails);

        if (groupDetails) {
          // 3. Fetch the group's todos
          const groupTasks = await getGroupTodos(groupDetails.id);
          setTasks(groupTasks);
        }
      } else {
        // User is not in a group, clear tasks and group
        setTasks([]);
        setGroup(null);
      }
    } catch {
      setError(failedLoadText);
    } finally {
      setLoading(false);
    }
  }, [session, failedLoadText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Toggles the completion status of a task and updates the database.
   */
  const toggleTask = async (id: number, currentStatus: boolean) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_completed: !currentStatus } : t
      )
    );
    try {
      await updateTodoCompletion(id, !currentStatus);
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_completed: currentStatus } : t
        )
      );
      setError(failedUpdateText);
    }
  };

  /**
   * Adds a new task to the database and updates the UI.
   */
  const handleAddTask = async (
    taskData: Omit<NewTodo, 'user_id' | 'group_id'>
  ) => {
    if (!session || !group) {
      setError(groupRequiredText);
      return;
    }

    const newTodoData: NewTodo = {
      ...taskData,
      user_id: session.user.id,
      group_id: group.id,
    };

    try {
      const addedTask = await addTodo(newTodoData);
      setTasks((prev) => [addedTask, ...prev]);
    } catch {
      setError(failedAddText);
    }
  };

  /**
   * Deletes a task from the database and updates the UI.
   */
  const handleDeleteTask = async (id: number) => {
    const originalTasks = tasks;
    // Optimistically update the UI
    setTasks((prev) => prev.filter((task) => task.id !== id));
    try {
      await deleteTodo(id);
    } catch {
      // Revert UI on error
      setTasks(originalTasks);
      setError(failedDeleteText);
    }
  };

  const sortTasks = (list: Todo[]) =>
    [...list].sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      const dateA = new Date(a.date_and_time).getTime();
      const dateB = new Date(b.date_and_time).getTime();
      return dateA - dateB;
    });

  // Split tasks by date
  const pastTasks = sortTasks(
    tasks.filter((task) => task.date_and_time.split('T')[0] < today)
  );
  const todaysTasks = sortTasks(
    tasks.filter((task) => task.date_and_time.split('T')[0] === today)
  );
  const futureTasks = sortTasks(
    tasks.filter((task) => task.date_and_time.split('T')[0] > today)
  );

  const renderTaskSection = (title: string, tasksList: Todo[]) => (
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
                id={task.id}
                label={task.label}
                completed={task.is_completed}
                date={task.date_and_time.split('T')[0]}
                time={task.date_and_time.split('T')[1].substring(0, 5)}
                onToggle={() => toggleTask(task.id, task.is_completed)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );

  if (loading) {
    return <div className="p-4">{loadingText}</div>;
  }

  if (!session) {
    return <div className="p-4">{loginText}</div>;
  }

  if (!group) {
    return (
      <div className="p-4 text-center">
        <Header />
        <h2 className="mt-10 text-xl font-semibold">{welcomeText}</h2>
        <p className="text-gray-600 mt-2">{groupNeededText}</p>
        <p className="text-gray-600 mt-1">{goToAccountText}</p>
        <a
          href="/account"
          className="text-blue-500 hover:underline mt-4 inline-block"
        >
          {goToAccountLinkText}
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <Header />
      <ProgressBar tasks={todaysTasks} />
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{todaysTasksText}</h3>
        <AddTask onAdd={handleAddTask} />
      </div>

      {error && <p className="text-red-500 my-2">{error}</p>}

      {todaysTasks.length > 0 && renderTaskSection('', todaysTasks)}
      {futureTasks.length > 0 &&
        renderTaskSection(futureTasksText, futureTasks)}
      {pastTasks.length > 0 && renderTaskSection(pastTasksText, pastTasks)}
    </div>
  );
}
