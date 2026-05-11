-- Run this in Supabase SQL Editor FIRST
-- https://supabase.com/dashboard/project/hupiajaktgvilomucadg/sql

-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Grant admin access to super.ric@gmail.com
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'super.ric@gmail.com' LIMIT 1);

-- If the update above returns 0 rows, the user might not have a profile yet
-- This creates a profile with admin access
INSERT INTO profiles (id, is_admin)
SELECT id, true FROM auth.users WHERE email = 'super.ric@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;