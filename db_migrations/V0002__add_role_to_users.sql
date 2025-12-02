-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';

-- Update existing users to have student role
UPDATE users SET role = 'student' WHERE role IS NULL;

-- Add constraint to ensure role is either 'student' or 'teacher'
ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('student', 'teacher'));