-- Enable REPLICA IDENTITY FULL on expenses table
-- This allows Supabase Realtime to receive the full old record on DELETE events
-- enabling filtering by group_id even when the row is deleted.

ALTER TABLE expenses REPLICA IDENTITY FULL;
