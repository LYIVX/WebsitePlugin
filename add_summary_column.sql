-- SQL Migration to add summary column to forums table
ALTER TABLE forums ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT NULL;
