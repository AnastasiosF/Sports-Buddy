-- Fix match_participants RLS policy to allow match creators to invite users
-- This script updates the INSERT policy to allow both:
-- 1. Users joining matches themselves
-- 2. Match creators inviting users to their matches

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can join matches" ON match_participants;

-- Create a new policy that allows both self-joining and creator invitations
CREATE POLICY "Users can join matches or be invited by creators" ON match_participants FOR INSERT WITH CHECK (
  -- Allow users to join matches themselves
  auth.uid() = user_id 
  OR 
  -- Allow match creators to invite users to their matches
  EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = match_participants.match_id 
    AND matches.created_by = auth.uid()
  )
);