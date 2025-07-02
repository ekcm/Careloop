import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('ENV:', process.env.NEXT_PUBLIC_SUPABASE_URL);
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL and Anon Key are not set. Please check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Todo {
  id: number;
  user_id: string;
  is_completed: boolean;
  label: string;
  date_and_time: string;
  reward: string | null;
  notes: string | null;
}

export interface NewTodo {
  label: string;
  user_id: string;
  date_and_time: string;
  notes?: string | null;
  reward?: string | null;
}

/**
 * GET Function: Fetches all todos for a specific user.
 * @param userId - The ID of the user whose todos are to be fetched.
 * @returns A promise that resolves to an array of todos.
 * @throws Throws a PostgrestError if the fetch operation fails.
 */
export const getTodos = async (userId: string): Promise<Todo[]> => {
  console.log(`Fetching todos for user: ${userId}`);
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('date_and_time', { ascending: false });

  if (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }

  return data || [];
};

/**
 * POST Function: Adds a new todo to the database.
 * @param newTodo - An object containing the details of the new todo.
 * @returns A promise that resolves to the newly created todo.
 * @throws Throws a PostgrestError if the insert operation fails.
 */
export const addTodo = async (newTodo: NewTodo): Promise<Todo> => {
  console.log('Adding new todo:', newTodo);
  const { data, error } = await supabase
    .from('todos')
    .insert({
      ...newTodo,
      is_completed: false,
      date_and_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding todo:', error);
    throw error;
  }

  return data;
};

/**
 * UPDATE Function: Updates the completion status of a specific todo.
 * @param id - The ID of the todo to update.
 * @param is_completed - The new completion status.
 * @returns A promise that resolves when the update is successful.
 * @throws Throws a PostgrestError if the update operation fails.
 */
export const updateTodoCompletion = async (
  id: number,
  is_completed: boolean
): Promise<void> => {
  console.log(`Updating todo ${id} to completed status: ${is_completed}`);
  const { error } = await supabase
    .from('todos')
    .update({ is_completed })
    .eq('id', id);

  if (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};

/**
 * DELETE Function: Removes a todo from the database.
 * @param id - The ID of the todo to delete.
 * @returns A promise that resolves when the deletion is successful.
 * @throws Throws a PostgrestError if the delete operation fails.
 */
export const deleteTodo = async (id: number): Promise<void> => {
  console.log(`Deleting todo with id: ${id}`);
  const { error } = await supabase.from('todos').delete().eq('id', id);

  if (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};
