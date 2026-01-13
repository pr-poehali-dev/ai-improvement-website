-- Add viewed_lectures column to track lecture views
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS viewed_lectures JSONB DEFAULT '[]'::jsonb;