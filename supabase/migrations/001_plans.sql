-- Career GPS: plans table
-- Run this in your Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists plans (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  share_token  text        not null unique default encode(gen_random_bytes(8), 'hex'),
  form_data    jsonb       not null default '{}',
  plan_data    jsonb       not null default '{}',
  progress     jsonb       not null default '{}'
);

-- RLS: anyone can read (via share token), insert, or update progress
alter table plans enable row level security;

create policy "public_read"   on plans for select using (true);
create policy "public_insert" on plans for insert with check (true);
create policy "public_update" on plans for update using (true) with check (true);
