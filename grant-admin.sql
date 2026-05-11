-- Run this in Supabase SQL Editor to grant admin access
-- https://supabase.com/dashboard/project/hupiajaktgvilomucadg/sql

-- First, add is_admin column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Update the profile for super.ric@gmail.com
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'super.ric@gmail.com' LIMIT 1);

-- Verify the update
SELECT
  auth.users.email,
  profiles.is_admin
FROM profiles
JOIN auth.users ON profiles.id = auth.users.id
WHERE auth.users.email = 'super.ric@gmail.com';