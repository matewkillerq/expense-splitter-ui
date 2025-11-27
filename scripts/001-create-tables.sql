-- Enable RLS
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create groups table
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text not null default '👥',
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create group_members table (junction table for users in groups)
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null, -- For non-registered members
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id),
  unique(group_id, name)
);

-- Create expenses table
create table if not exists public.expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  title text not null,
  amount decimal(10, 2) not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create expense_payers table (who paid for the expense)
create table if not exists public.expense_payers (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  member_id uuid references public.group_members(id) on delete cascade not null,
  amount decimal(10, 2) not null
);

-- Create expense_participants table (who shares the expense)
create table if not exists public.expense_participants (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  member_id uuid references public.group_members(id) on delete cascade not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_payers enable row level security;
alter table public.expense_participants enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Groups policies
create policy "Users can view groups they are members of"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
    )
    or created_by = auth.uid()
  );

create policy "Users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Group creators can update their groups"
  on public.groups for update
  using (auth.uid() = created_by);

create policy "Group creators can delete their groups"
  on public.groups for delete
  using (auth.uid() = created_by);

-- Group members policies
create policy "Users can view members of their groups"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.groups g
      where g.id = group_members.group_id
      and g.created_by = auth.uid()
    )
  );

create policy "Group members can add new members"
  on public.group_members for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id
      and g.created_by = auth.uid()
    )
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Group creators can remove members"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.groups g
      where g.id = group_id
      and g.created_by = auth.uid()
    )
  );

-- Expenses policies
create policy "Users can view expenses in their groups"
  on public.expenses for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = expenses.group_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Users can create expenses in their groups"
  on public.expenses for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = group_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Expense creators can delete their expenses"
  on public.expenses for delete
  using (auth.uid() = created_by);

-- Expense payers policies
create policy "Users can view expense payers in their groups"
  on public.expense_payers for select
  using (
    exists (
      select 1 from public.expenses e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = expense_payers.expense_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Users can add expense payers"
  on public.expense_payers for insert
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
      and e.created_by = auth.uid()
    )
  );

-- Expense participants policies
create policy "Users can view expense participants in their groups"
  on public.expense_participants for select
  using (
    exists (
      select 1 from public.expenses e
      join public.group_members gm on gm.group_id = e.group_id
      where e.id = expense_participants.expense_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Users can add expense participants"
  on public.expense_participants for insert
  with check (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id
      and e.created_by = auth.uid()
    )
  );

-- Create function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
