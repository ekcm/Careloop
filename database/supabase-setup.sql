-- Careloop Database Schema Setup
-- Run this with: supabase db reset --linked

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table  
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  group_id UUID REFERENCES groups(id),
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todos table
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  group_id UUID NOT NULL REFERENCES groups(id),
  label TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  date_and_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reward TEXT,
  notes TEXT,
  icon TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  comment_content TEXT NOT NULL,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  author_name TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Groups RLS Policies
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM profiles WHERE id = auth.uid()
    ) OR admin_id = auth.uid()
  );

CREATE POLICY "Admins can delete their groups" ON groups
  FOR DELETE USING (auth.uid() = admin_id);

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Todos RLS Policies
CREATE POLICY "Users can view group todos" ON todos
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create todos in their group" ON todos
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update todos in their group" ON todos
  FOR UPDATE USING (
    group_id IN (
      SELECT group_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete todos in their group" ON todos
  FOR DELETE USING (
    group_id IN (
      SELECT group_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Comments RLS Policies
CREATE POLICY "Users can view comments on group todos" ON comments
  FOR SELECT USING (
    todo_id IN (
      SELECT id FROM todos WHERE group_id IN (
        SELECT group_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on group todos" ON comments
  FOR INSERT WITH CHECK (
    todo_id IN (
      SELECT id FROM todos WHERE group_id IN (
        SELECT group_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create RPC function for getting group members
CREATE OR REPLACE FUNCTION get_members_of_group(p_group_id UUID)
RETURNS TABLE(id UUID, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT profiles.id, profiles.display_name
  FROM profiles
  WHERE profiles.group_id = p_group_id;
END;
$$;

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_profiles_group_id ON profiles(group_id);
CREATE INDEX idx_todos_group_id ON todos(group_id);
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_date_time ON todos(date_and_time DESC);
CREATE INDEX idx_comments_todo_id ON comments(todo_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Enable realtime for todos and comments (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;