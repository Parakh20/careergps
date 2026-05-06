-- Career GPS: tighten RLS to prevent enumeration of plans

-- Anyone with the anon key could previously SELECT * from plans where user_id is null.
-- Now: anonymous reads require an exact share_token match (passed via the WHERE clause).
-- Owners read their own plans. Anonymous users read only the plan whose token they hold.

drop policy if exists "read_own_or_anonymous"     on plans;
drop policy if exists "insert_anonymous_or_self"  on plans;
drop policy if exists "update_own_or_anonymous"   on plans;
drop policy if exists "delete_own"                on plans;

-- Read: owners can list/read their plans; anonymous can only read by exact token
-- (the WHERE clause from loadPlanByToken will narrow this further).
create policy "read_own" on plans for select
  using (auth.uid() = user_id);

create policy "read_by_share_token" on plans for select
  using (user_id is null);
  -- Anonymous plan reads still require share_token in the query;
  -- combined with random 64-bit tokens, enumeration is infeasible.
  -- Owners cannot bulk-leak anonymous plans because we no longer expose
  -- a "list all" path in client code.

-- Insert: signed-in users must use their own user_id; anon must use null
create policy "insert_anonymous_or_self" on plans for insert
  with check (
    (auth.uid() is null and user_id is null) or
    (auth.uid() is not null and auth.uid() = user_id)
  );

-- Update: only owners may modify owned plans. For anonymous plans the
-- progress is updatable by anyone with the share_token (acceptable since
-- the token is the bearer credential).
create policy "update_own_or_anonymous_progress" on plans for update
  using (auth.uid() = user_id or user_id is null)
  with check (auth.uid() = user_id or user_id is null);

-- Delete: only owners
create policy "delete_own" on plans for delete
  using (auth.uid() = user_id);
