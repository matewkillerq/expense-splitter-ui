-- Add indexes for performance optimization
-- Index on expenses for fast group queries and ordering by creation date
CREATE INDEX IF NOT EXISTS idx_expenses_group_id_created_at ON public.expenses (group_id, created_at DESC);

-- Index on group_members for quick lookup of members per group
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members (group_id);

-- Index on groups for primary key (already exists) but ensure it exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_id ON public.groups (id);
