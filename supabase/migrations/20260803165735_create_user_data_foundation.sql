-- TourMate AI user data foundation.
-- This migration intentionally creates storage only; no application UI reads it yet.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length_check check (
    full_name is null
    or char_length(btrim(full_name)) between 1 and 200
  ),
  constraint profiles_plan_check check (plan in ('free', 'plus', 'premium'))
);

create table public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date,
  end_date date,
  travellers smallint not null default 1,
  budget text,
  interests text[] not null default '{}'::text[],
  pace text,
  itinerary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_trips_title_check check (
    char_length(btrim(title)) between 1 and 200
  ),
  constraint saved_trips_destination_check check (
    char_length(btrim(destination)) between 1 and 200
  ),
  constraint saved_trips_date_order_check check (
    start_date is null or end_date is null or end_date >= start_date
  ),
  constraint saved_trips_travellers_check check (travellers between 1 and 100),
  constraint saved_trips_budget_check check (
    budget is null or lower(budget) in ('budget', 'comfort', 'luxury')
  ),
  constraint saved_trips_interests_check check (
    cardinality(interests) <= 50 and array_position(interests, null) is null
  ),
  constraint saved_trips_pace_check check (
    pace is null or lower(pace) in ('relaxed', 'balanced', 'packed')
  ),
  constraint saved_trips_itinerary_check check (
    jsonb_typeof(itinerary) in ('object', 'array')
    and pg_column_size(itinerary) <= 1048576
  )
);

create table public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_type text not null,
  item_id text not null,
  item_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint favourites_item_type_check check (item_type in ('hotel', 'attraction')),
  constraint favourites_item_id_check check (
    char_length(btrim(item_id)) between 1 and 200
  ),
  constraint favourites_item_snapshot_check check (
    jsonb_typeof(item_snapshot) = 'object'
    and pg_column_size(item_snapshot) <= 262144
  ),
  constraint favourites_user_item_unique unique (user_id, item_type, item_id)
);

create index saved_trips_user_created_at_idx
  on public.saved_trips (user_id, created_at desc);

create index favourites_user_created_at_idx
  on public.favourites (user_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger saved_trips_set_updated_at
before update on public.saved_trips
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 200)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;

create trigger tourmate_on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Backfill profiles for accounts created before this migration. ON CONFLICT
-- makes the operation safe if a profile was created concurrently by the trigger.
insert into public.profiles (id, full_name, created_at, updated_at)
select
  users.id,
  left(nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''), 200),
  coalesce(users.created_at, now()),
  coalesce(users.created_at, now())
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.saved_trips enable row level security;
alter table public.favourites enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can insert their own saved trips"
on public.saved_trips
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their own saved trips"
on public.saved_trips
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their own saved trips"
on public.saved_trips
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved trips"
on public.saved_trips
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own favourites"
on public.favourites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can read their own favourites"
on public.favourites
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update their own favourites"
on public.favourites
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own favourites"
on public.favourites
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Supabase projects can have broad public-schema default privileges. Reset the
-- three new tables to the exact application permissions required here.
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.saved_trips from public, anon, authenticated;
revoke all on table public.favourites from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;
grant select, insert, delete on table public.saved_trips to authenticated;
grant update (
  title,
  destination,
  start_date,
  end_date,
  travellers,
  budget,
  interests,
  pace,
  itinerary
) on table public.saved_trips to authenticated;
grant select, insert, delete on table public.favourites to authenticated;
grant update (item_type, item_id, item_snapshot)
  on table public.favourites to authenticated;

grant select, insert, update, delete on table public.profiles to service_role;
grant select, insert, update, delete on table public.saved_trips to service_role;
grant select, insert, update, delete on table public.favourites to service_role;
