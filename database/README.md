# Database Setup

This directory contains the database schema and setup scripts for Careloop.

## Files

- `supabase-setup.sql` - Complete Supabase database schema with tables, RLS policies, functions, and triggers

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Run Database Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-setup.sql`
4. Paste and run the SQL

This will create:

## Database Schema

### Tables Created

#### `groups`
- User groups for task collaboration
- Fields: `id`, `name`, `admin_id`, `created_at`, `updated_at`

#### `profiles`
- User profiles linked to auth.users
- Fields: `id`, `group_id`, `display_name`, `created_at`, `updated_at`

#### `todos`
- Task items with group association
- Fields: `id`, `user_id`, `group_id`, `label`, `is_completed`, `date_and_time`, `reward`, `notes`, `icon`, `author_name`

#### `comments`
- Comments on tasks
- Fields: `id`, `created_at`, `comment_content`, `todo_id`, `user_id`, `author_name`

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access data from their groups
- Admins can manage their groups
- Users can manage their own profiles
- Proper data isolation between groups

### Functions

#### `get_members_of_group(p_group_id UUID)`
Returns all members of a specific group.

#### `handle_new_user()`
Trigger function that automatically creates user profiles when users sign up.

### Indexes

Performance indexes on commonly queried fields:
- `profiles.group_id`
- `todos.group_id`, `todos.user_id`, `todos.date_and_time`
- `comments.todo_id`, `comments.created_at`

### Real-time Subscriptions

Enabled for `todos` and `comments` tables to support live collaboration features.

## Troubleshooting

### Common Issues

**"Table doesn't exist" errors:**
- Ensure you ran the complete SQL script
- Check that all tables were created successfully

**Permission denied errors:**
- RLS policies might be blocking access
- Verify user authentication is working
- Check that user profiles exist

**Missing user profile:**
- The trigger should create profiles automatically for new users
- For existing users, manually insert into profiles table:
```sql
INSERT INTO profiles (id, display_name) 
VALUES ('USER_ID_HERE', 'Display Name')
ON CONFLICT (id) DO NOTHING;
```

### Verification

To verify the setup worked:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Schema Updates

When modifying the database schema:

1. Update `supabase-setup.sql` with your changes
2. Test changes on a development database first
3. Document any breaking changes
4. Consider migration scripts for production updates