import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  group_id: string;
  icon: string;
}

export interface NewTodo {
  label: string;
  user_id: string;
  date_and_time: string;
  notes?: string | null;
  reward?: string | null;
  group_id?: string;
  icon: string;
}

export interface Group {
  id: string;
  name: string;
  admin_id: string;
}

export interface Profile {
  id: string;
  group_id: string;
  display_name: string;
}

export interface GroupMember {
  id: string;
  display_name: string | null;
}

export interface NewCommentPayload {
  comment_content: string;
  todo_id: number;
  user_id: string;
  author_name: string;
}

export interface Comment {
  id: string;
  created_at: string;
  comment_content: string;
  todo_id: string;
  user_id: string;
  author_name: string;
}

// GROUP FUNCTIONS

/**
 * Fetches the user's profile to determine their group status.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the user's profile, or null if not found.
 * @throws Throws an error if the fetch operation fails.
 */
export const getUserProfile = async (
  userId: string
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
  return data;
};

/**
 * Fetches the details for a specific group.
 * @param groupId The ID of the group to fetch.
 * @returns A promise that resolves to the group's data.
 * @throws Throws an error if the fetch operation fails.
 */
export const getGroupDetails = async (
  groupId: string
): Promise<Group | null> => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error) {
    console.error('Error fetching group details:', error);
    throw error;
  }
  return data;
};

/**
 * Fetches all members of a specific group.
 * @param groupId The ID of the group.
 * @returns A promise that resolves to an array of group members.
 * @throws Throws an error if the fetch operation fails.
 */
export const getGroupMembers = async (
  groupId: string
): Promise<GroupMember[]> => {
  const { data, error } = await supabase.rpc('get_members_of_group', {
    p_group_id: groupId,
  });

  if (error) {
    console.error('Error fetching group members via RPC:', error);
    throw error;
  }
  return data || [];
};

/**
 * Creates a new group and assigns the creator as the admin.
 * @param groupName The name for the new group.
 * @param adminId The user ID of the group's creator/admin.
 * @returns A promise that resolves to the newly created group object.
 * @throws Throws an error if the operation fails.
 */
export const createGroup = async (
  groupName: string,
  adminId: string
): Promise<Group> => {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name: groupName, admin_id: adminId })
    .select()
    .single();

  if (error) {
    console.error('Error creating group:', error);
    throw error;
  }
  return data;
};

/**
 * Updates a user's profile to add them to a specific group by looking up the group's name.
 * @param userId The ID of the user to add to the group.
 * @param groupName The unique name of the group to join.
 */
export const joinGroupByName = async (
  userId: string,
  groupName: string
): Promise<void> => {
  const { data: group, error: findError } = await supabase
    .from('groups')
    .select('id')
    .eq('name', groupName)
    .single();

  if (findError || !group) {
    throw new Error('Group not found. Please check the name and try again.');
  }

  const groupId = group.id;

  // If the group was found, update the user's profile with the ID.
  const { error: joinError } = await supabase
    .from('profiles')
    .update({ group_id: groupId })
    .eq('id', userId);

  if (joinError) {
    throw joinError;
  }
};

/**
 * Removes a user from their current group by setting their group_id to null.
 * This can be used for leaving a group or being kicked.
 * @param userId The ID of the user to remove from the group.
 * @returns A promise that resolves when the user has been removed.
 * @throws Throws an error if the update operation fails.
 */
export const leaveOrBeKickedFromGroup = async (
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ group_id: null })
    .eq('id', userId);

  if (error) {
    console.error(`Error removing user ${userId} from group:`, error);
    throw error;
  }
};

/**
 * Deletes a group. This can only be performed by the group's admin.
 * RLS policies on the backend enforce the admin check.
 * @param groupId The ID of the group to delete.
 * @returns A promise that resolves when the group is successfully deleted.
 * @throws Throws an error if the delete operation fails.
 */
export const deleteGroup = async (groupId: string): Promise<void> => {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);

  if (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

// TODO FUNCTIONS

/**
 * Fetches all todos for a specific group.
 * @param groupId The ID of the group whose todos are to be fetched.
 * @returns A promise that resolves to an array of todos.
 * @throws Throws an error if the fetch operation fails.
 */
/**
 * Fetches all todos for a specific group.
 * @param groupId The ID of the group whose todos are to be fetched.
 * @returns A promise that resolves to an array of todos.
 * @throws Throws an error if the fetch operation fails.
 */
export const getGroupTodos = async (groupId: string): Promise<Todo[]> => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('group_id', groupId)
    .order('date_and_time', { ascending: false }); // <-- THE FIX IS HERE

  if (error) {
    console.error('Error fetching group todos:', error);
    throw error;
  }

  return data || [];
};

/**
 * Adds a new todo to the database for a specific group.
 * @param newTodo An object containing the details of the new todo, including group_id.
 * @returns A promise that resolves to the newly created todo.
 * @throws Throws an error if the insert operation fails.
 */
export const addTodo = async (newTodo: NewTodo): Promise<Todo> => {
  const { data, error } = await supabase
    .from('todos')
    .insert({
      ...newTodo,
      is_completed: false,
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
 * Updates the completion status of a specific todo.
 * @param todoId The ID of the todo to update.
 * @param is_completed The new completion status.
 * @returns A promise that resolves when the update is successful.
 * @throws Throws an error if the update operation fails.
 */
export const updateTodoCompletion = async (
  todoId: number,
  is_completed: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('todos')
    .update({ is_completed })
    .eq('id', todoId);

  if (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};

/**
 * Deletes a todo from the database.
 * @param todoId The ID of the todo to delete.
 * @returns A promise that resolves when the deletion is successful.
 * @throws Throws an error if the delete operation fails.
 */
export const deleteTodo = async (todoId: number): Promise<void> => {
  const { error } = await supabase.from('todos').delete().eq('id', todoId);

  if (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};

// Comment Functions

/**
 * Fetches all comments for a specific todo, along with the author's profile.
 * @param todoId The ID of the todo whose comments are to be fetched.
 * @returns A promise that resolves to an array of comments with author profiles.
 * @throws Throws an error if the fetch operation fails.
 */
export const getTodoComments = async (todoId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      profile:profiles ( display_name )
    `
    )
    .eq('todo_id', todoId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  // map through fetched comments and useT

  return data || [];
};

/**
 * Adds a new comment to a specific todo.
 * @param newComment An object containing the content, todo_id, and user_id.
 * @returns A promise that resolves to the newly created comment.
 * @throws Throws an error if the insert operation fails.
 */
export const addComment = async (
  newComment: NewCommentPayload
): Promise<Comment> => {
  const { data, error } = await supabase
    .from('comments')
    .insert(newComment)
    .select(
      `
      *,
      profile:profiles ( display_name )
    `
    )
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
};

/**
 * Deletes a comment from the database.
 * @param commentId The ID of the comment to delete.
 * @returns A promise that resolves when the deletion is successful.
 * @throws Throws an error if the delete operation fails.
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};
