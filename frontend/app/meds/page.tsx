'use client';
import React, { useState, useEffect, FC, FormEvent } from 'react';
import {
  supabase,
  getTodos,
  addTodo,
  updateTodoCompletion,
  deleteTodo,
  Todo,
  NewTodo,
} from '../apis/supabaseApi';

const TodoTestComponent: FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoLabel, setNewTodoLabel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [newTodoDateTime, setNewTodoDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Effect to get the current user's ID on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        setError('No user is logged in. Please log in to test the functions.');
      }
    };
    fetchUser();
  }, []);

  // Effect to fetch todos when the userId is set
  useEffect(() => {
    if (userId) {
      handleGetTodos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /**
   * Handles fetching all todos for the current user.
   */
  const handleGetTodos = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedTodos = await getTodos(userId);
      setTodos(fetchedTodos);
    } catch {
      setError(`Failed to fetch todos`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles adding a new todo.
   */
  const handleAddTodo = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTodoLabel.trim() || !userId || !newTodoDateTime) return;
    setLoading(true);
    setError(null);
    try {
      const newTodoData: NewTodo = {
        label: newTodoLabel,
        user_id: userId,
        date_and_time: newTodoDateTime,
      };
      const addedTodo = await addTodo(newTodoData);
      setTodos([addedTodo, ...todos]); // Add new todo to the top of the list
      setNewTodoLabel(''); // Clear input field
      setNewTodoDateTime(new Date().toISOString().slice(0, 16)); // Reset date
    } catch {
      setError(`Failed to add todo`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles toggling the completion status of a todo.
   */
  const handleToggleComplete = async (todo: Todo) => {
    setError(null);
    try {
      await updateTodoCompletion(todo.id, !todo.is_completed);
      setTodos(
        todos.map((t) =>
          t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t
        )
      );
    } catch {
      setError(`Failed to update todo`);
    }
  };

  /**
   * Handles deleting a todo.
   */
  const handleDeleteTodo = async (id: number) => {
    setError(null);
    try {
      await deleteTodo(id);
      setTodos(todos.filter((t) => t.id !== id));
    } catch {
      setError(`Failed to delete todo`);
    }
  };

  return (
    <div className="p-8 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">
          Todo API Test
        </h1>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            {error}
          </div>
        )}

        {userId ? (
          <>
            {/* Form to add a new todo */}
            <form
              onSubmit={handleAddTodo}
              className="mb-6 p-4 bg-white rounded-lg shadow"
            >
              <input
                type="text"
                value={newTodoLabel}
                onChange={(e) => setNewTodoLabel(e.target.value)}
                placeholder="Add a new todo label..."
                className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="datetime-local"
                value={newTodoDateTime}
                onChange={(e) => setNewTodoDateTime(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newTodoLabel.trim()}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Adding...' : 'Add Todo (POST)'}
              </button>
            </form>

            {/* Display list of todos */}
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-gray-700">
                Your Todos
              </h2>
              {loading && <p>Loading...</p>}
              {todos.length > 0
                ? todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between bg-white p-4 rounded-lg shadow"
                    >
                      <div>
                        <span
                          className={`${todo.is_completed ? 'line-through text-gray-400' : ''}`}
                        >
                          {todo.label}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(todo.date_and_time).toLocaleString(
                            'en-GB',
                            { timeZone: 'UTC' }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleComplete(todo)}
                          className={`px-3 py-1 text-sm rounded text-white ${todo.is_completed ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                          {todo.is_completed ? 'Undo' : 'Complete'} (UPDATE)
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete (DELETE)
                        </button>
                      </div>
                    </div>
                  ))
                : !loading && <p>No todos found. Add one above!</p>}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">
            Please log in to manage your todos.
          </p>
        )}
      </div>
    </div>
  );
};

export default TodoTestComponent;
