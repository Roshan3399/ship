-- Add username and settings columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_digest BOOLEAN DEFAULT true;

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
