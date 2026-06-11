-- Migration: Change `skills` column from TEXT[] to plain TEXT
-- Run this once in the Supabase SQL Editor

ALTER TABLE profiles
  ALTER COLUMN skills TYPE TEXT USING CASE
    WHEN skills IS NULL THEN NULL
    ELSE array_to_string(skills, ', ')
  END;
