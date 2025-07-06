'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Profile,
} from '@/apis/supabaseApi';
import ProgressBar from '@/components/ProgressBar';
import Header from '@/components/Header';
import TaskItem from '@/components/TaskItem';
import AddTask from '@/components/AddTask';
import { Session } from '@supabase/supabase-js';
import { useT } from '@/hooks/useTranslation';

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function HomePage() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Translation hooks
  const loadingText = useT('Loading tasks...');
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
  const failedCommentLoadText = useT('Failed to load comments.');

  const today = getTodayString();

  /**
   * Effect hook to check for an active session and listen for auth state changes.
   * Redirect to /account if not logged in.
   */
  useEffect(() => {
    // Fetch current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) router.replace('/account');
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) router.replace('/account');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  /**
   * Fetches all necessary data from Supabase: user's group, todos, and all comments for those todos.
   */
  const fetchData = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userProfile = await getUserProfile(session.user.id);
      if (!userProfile?.group_id) {
        setTasks([]);
        setGroup(null);
        setUserProfile(null);
        return; // Early return if not in a group
      }
      setUserProfile(userProfile);
      const groupDetails = await getGroupDetails(userProfile.group_id);
      setGroup(groupDetails);

      if (!groupDetails) return; // Early return if group details not found

      const groupTasks = await getGroupTodos(groupDetails.id);
      setTasks(groupTasks);
    } catch {
      // Catch any other errors (profile, group, tasks fetch)
      setError(failedLoadText);
    } finally {
      setLoading(false);
    }
  }, [session, failedLoadText, failedCommentLoadText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -------------------- (handlers unchanged) -------------------- */
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

  const handleDeleteTask = async (id: number) => {
    const originalTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== id)); // optimistic
    try {
      await deleteTodo(id);
    } catch {
      setTasks(originalTasks); // revert
      setError(failedDeleteText);
    }
  };

  /* -------------------- (helpers & rendering logic unchanged) -------------------- */
  const sortTasks = (list: Todo[]) =>
    [...list].sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      const dateA = new Date(a.date_and_time).getTime();
      const dateB = new Date(b.date_and_time).getTime();
      return dateA - dateB;
    });

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
                icon={task.icon}
                label={task.label}
                completed={task.is_completed}
                date={task.date_and_time.split('T')[0]}
                time={task.date_and_time.split('T')[1].substring(0, 5)}
                notes={task.notes || ''}
                onToggle={() => toggleTask(task.id, task.is_completed)}
                onDelete={() => handleDeleteTask(task.id)}
                todo_id={task.id}
                user_id={userProfile?.id || ''}
                author_name={userProfile?.display_name || ''}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );

  /* -------------------------------------------------------------------------- */
  /*  UI states below remain the same except the "not logged in" state is gone  */
  /*  because the user will have been redirected already.                       */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <svg
          className="animate-spin h-8 w-8 text-blue-500 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <span className="text-gray-600 text-lg">{loadingText}</span>
      </div>
    );
  }

  /* No need for a "not‑session" check; we're already redirected */

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
