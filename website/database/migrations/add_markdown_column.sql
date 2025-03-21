-- Add the markdown column to the forums table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'forums' AND column_name = 'markdown'
    ) THEN 
        ALTER TABLE forums ADD COLUMN markdown BOOLEAN DEFAULT FALSE;
    END IF;
END $$; 