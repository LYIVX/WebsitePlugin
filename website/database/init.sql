-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    avatar TEXT,
    minecraft_username TEXT,
    access_token TEXT,
    refresh_token TEXT,
    email_notifications BOOLEAN DEFAULT false,
    discord_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rank_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_ranks table
CREATE TABLE IF NOT EXISTS user_ranks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    features TEXT[],
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forum_users table (separate from main users table)
CREATE TABLE IF NOT EXISTS forum_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    email TEXT,
    avatar TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forums table with reference to forum_users
CREATE TABLE IF NOT EXISTS forums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES forum_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    markdown BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create forum comments table with reference to forum_users
CREATE TABLE IF NOT EXISTS forum_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
    user_id UUID REFERENCES forum_users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create increment function for view counter
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer 
LANGUAGE SQL IMMUTABLE STRICT
AS $$
    SELECT $1 + 1
$$;

-- Create function to return a creation success for the increment function
CREATE OR REPLACE FUNCTION create_increment_function()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if increment function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'increment' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RETURN true;
    END IF;

    -- Create increment function - using EXECUTE to run dynamic SQL
    EXECUTE '
    CREATE OR REPLACE FUNCTION increment(x integer)
    RETURNS integer 
    LANGUAGE SQL IMMUTABLE STRICT
    AS $func$
        SELECT $1 + 1
    $func$;
    ';
    
    RETURN true;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to check if a trigger exists
CREATE OR REPLACE FUNCTION trigger_exists(trigger_name TEXT, table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    exists_val BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = trigger_name 
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = table_name AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) INTO exists_val;
    
    RETURN exists_val;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS BOOLEAN AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1
        AND column_name = $2
    ) INTO column_exists;
    
    RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables if they don't exist
DO $$
BEGIN
    -- Users table trigger
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at' 
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'users' AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Purchases table trigger
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_purchases_updated_at' 
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'purchases' AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) THEN
        CREATE TRIGGER update_purchases_updated_at
        BEFORE UPDATE ON purchases
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- User ranks table trigger
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_user_ranks_updated_at' 
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'user_ranks' AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) THEN
        CREATE TRIGGER update_user_ranks_updated_at
        BEFORE UPDATE ON user_ranks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Forum users table trigger
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_forum_users_updated_at' 
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'forum_users' AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) THEN
        CREATE TRIGGER update_forum_users_updated_at
        BEFORE UPDATE ON forum_users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Forums table trigger
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_forums_updated_at' 
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'forums' AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) THEN
        CREATE TRIGGER update_forums_updated_at
        BEFORE UPDATE ON forums
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Forum comments table trigger
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'update_forum_comments_updated_at' 
        AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'forum_comments' AND pg_class.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    ) THEN
        CREATE TRIGGER update_forum_comments_updated_at
        BEFORE UPDATE ON forum_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- Add parent_id column to forum_comments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'forum_comments'
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE forum_comments
        ADD COLUMN parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Function to create parent_id column in forum_comments table
CREATE OR REPLACE FUNCTION create_parent_id_column()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'forum_comments'
        AND column_name = 'parent_id'
    ) THEN
        -- Add parent_id column if it doesn't exist
        EXECUTE 'ALTER TABLE forum_comments ADD COLUMN parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE';
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to create execute_sql RPC function in Supabase
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql;

-- Check if updated_at column exists in forum_comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'forum_comments'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE forum_comments 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$;

-- Add discord_id column to forum_users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'forum_users'
        AND column_name = 'discord_id'
    ) THEN
        ALTER TABLE forum_users
        ADD COLUMN discord_id TEXT;
    END IF;
END
$$;

-- Create a function to directly update comments via SQL
CREATE OR REPLACE FUNCTION update_comment(
    comment_id UUID,
    new_content TEXT
)
RETURNS SETOF forum_comments AS $$
BEGIN
    RETURN QUERY
    UPDATE forum_comments
    SET content = new_content,
        updated_at = NOW()
    WHERE id = comment_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Make sure forum_comments has updated_at column
ALTER TABLE forum_comments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Make sure forum_users has discord_id column
ALTER TABLE forum_users
ADD COLUMN IF NOT EXISTS discord_id TEXT;
