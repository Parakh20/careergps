-- Career GPS: add user ownership, titles, and archive state to plans
-- Run after 001_plans.sql. The migration workflow applies this automatically on push to main.

alter table plans
  add column if not exists user_id  uuid references auth.users(id) on delete cascade,
  add column if not exists title    text,
  add column if not exists archived boolean not null default false;

create index if not exists plans_user_id_idx    on plans (user_id);
create index if not exists plans_updated_at_idx on plans (updated_at desc);

-- Replace the permissive anonymous policies from 001_plans.sql with user-scoped ones
drop policy if exists "public_read"   on plans;
drop policy if exists "public_insert" on plans;
drop policy if exists "public_update" on plans;

-- Read: own plans (auth) or anonymous plans (legacy + share-link visitors)
create policy "read_own_or_anonymous" on plans for select
  using (user_id is null or auth.uid() = user_id);

-- Insert: signed-in users must use their own user_id; anon must use null
create policy "insert_anonymous_or_self" on plans for insert
  with check (
    (auth.uid() is null and user_id is null) or
    (auth.uid() is not null and auth.uid() = user_id)
  );

-- Update: owners update their own; anon plans remain updatable for shared progress
create policy "update_own_or_anonymous" on plans for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Delete: only owners
create policy "delete_own" on plans for delete
  using (auth.uid() = user_id);
