-- Migration: add member_id to boards + remove duplicate Aman Patel
-- Run this against your live database on Antigravity

-- 1. Remove duplicate Aman Patel (the one without a real avatar photo)
--    Keeps the row with avatar_url containing 'iran.liara.run' (the real photo)
DELETE FROM members
WHERE name = 'Aman Patel'
  AND avatar_url NOT LIKE '%iran.liara.run%';

-- 2. Add member_id column to boards (if not already present)
ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS member_id INTEGER REFERENCES members(id) ON DELETE SET NULL;

-- 3. Assign the existing 'Internship Project' board to Chahal (member 1)
--    Adjust the WHERE clause if your board id differs
UPDATE boards SET member_id = (SELECT id FROM members WHERE name = 'Chahal Goyal' LIMIT 1)
WHERE member_id IS NULL;
