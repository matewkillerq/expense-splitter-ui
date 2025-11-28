-- Enable Realtime for tables
-- Run this in your Supabase SQL Editor

begin;

-- Ensure the publication exists (it usually does by default)
-- create publication supabase_realtime;

-- Add tables to the publication
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table group_members;

commit;
