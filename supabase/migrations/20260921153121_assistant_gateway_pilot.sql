-- Additive controlled-pilot foundation. No content is declared verified by seed.
create table public.tourism_content (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  item_type text not null check (item_type in ('hotel','attraction')),
  name text not null check (char_length(name) between 1 and 200),
  location text not null check (char_length(location) between 1 and 160),
  category text not null check (char_length(category) between 1 and 120),
  country_code text not null default 'NA' check (country_code = 'NA'),
  source_label text not null check (char_length(source_label) between 1 and 200),
  source_url text not null check (source_url ~ '^https://' and char_length(source_url) <= 2048),
  verified_at timestamptz not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.tourism_content enable row level security;
revoke all on public.tourism_content from public, anon, authenticated;
grant select on public.tourism_content to authenticated;
grant select, insert, update, delete on public.tourism_content to service_role;
create policy "Read approved Namibia content" on public.tourism_content for select to authenticated
  using (approved and country_code = 'NA');
create index tourism_content_area_idx on public.tourism_content (location, id) where approved;

-- Server-written operational facts only. No prompt/response/profile JSON column.
create table public.assistant_usage (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  network_hash text not null check (network_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  provider text not null default 'demo' check (provider in ('demo','openai','gemini')),
  model text not null default 'deterministic-v1' check (model ~ '^[a-zA-Z0-9._:/-]{1,100}$'),
  request_type text not null default 'chat' check (request_type in ('chat','itinerary','recommendation','save','remove')),
  state text not null default 'reserved' check (state in ('reserved','success','fallback','validation_failure','timeout','cancelled','quota_rejection','provider_failure','unavailable')),
  input_tokens integer check (input_tokens between 0 and 10000000),
  output_tokens integer check (output_tokens between 0 and 10000000),
  estimated_cost_usd numeric(16,9) check (estimated_cost_usd >= 0),
  pricing_version text check (char_length(pricing_version) between 1 and 100),
  latency_ms integer not null default 0 check (latency_ms between 0 and 3600000),
  retrieval_count smallint not null default 0 check (retrieval_count between 0 and 8),
  tool_count smallint not null default 0 check (tool_count between 0 and 10),
  environment text not null default 'development' check (environment in ('development','test','preview','production')),
  app_version text not null default 'local' check (app_version ~ '^[a-zA-Z0-9._-]{1,64}$')
);
alter table public.assistant_usage enable row level security;
revoke all on public.assistant_usage from public, anon, authenticated;
grant select on public.assistant_usage to authenticated;
grant select, insert, update, delete on public.assistant_usage to service_role;
create policy "Administrators read Assistant operations" on public.assistant_usage for select to authenticated
  using ((select private.is_admin()));
create index assistant_usage_user_time_idx on public.assistant_usage (user_id, created_at desc);
create index assistant_usage_network_time_idx on public.assistant_usage (network_hash, created_at desc);
create index assistant_usage_retention_idx on public.assistant_usage (created_at);

-- Invoker privileges: only the trusted server role can admit requests or forge
-- counters. The server verifies the user through Auth before supplying p_user.
create function public.admit_assistant_request(p_request uuid, p_user uuid, p_network text,
  p_minute integer, p_day integer, p_ip_minute integer)
returns text language plpgsql security invoker set search_path = '' as $$
declare outcome text;
begin
  if p_user is null or p_request is null or p_network is null or p_minute is null or p_day is null or p_ip_minute is null
    or p_minute not between 1 and 60 or p_day not between 1 and 1000 or p_ip_minute not between 1 and 300
    or p_network !~ '^[a-f0-9]{64}$' then raise exception 'Invalid admission'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_network, 1));
  if exists (select 1 from public.assistant_usage where request_id = p_request) then return 'duplicate'; end if;
  outcome := case when
    (select count(*) from public.assistant_usage where user_id = p_user and created_at > now() - interval '1 minute') >= p_minute
    or (select count(*) from public.assistant_usage where user_id = p_user and created_at > now() - interval '24 hours') >= p_day
    or (select count(*) from public.assistant_usage where network_hash = p_network and created_at > now() - interval '1 minute') >= p_ip_minute
    then 'quota_rejection' else 'reserved' end;
  insert into public.assistant_usage (request_id,user_id,network_hash,state) values (p_request,p_user,p_network,outcome);
  return outcome;
end;
$$;
revoke all on function public.admit_assistant_request(uuid,uuid,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.admit_assistant_request(uuid,uuid,text,integer,integer,integer) to service_role;

-- Owner-aware RLS is still evaluated inside the aggregate. Ordinary users see
-- no rows; the function also explicitly requires administrator membership.
create function public.assistant_usage_summary()
returns table (state text, provider text, requests bigint, estimated_cost_usd numeric, unknown_cost_requests bigint, average_latency_ms numeric)
language sql stable security invoker set search_path = '' as $$
  select u.state, u.provider, count(*), sum(u.estimated_cost_usd),
    count(*) filter (where u.estimated_cost_usd is null), round(avg(u.latency_ms))
  from public.assistant_usage u
  where (select private.is_admin()) and u.created_at >= now() - interval '14 days'
  group by u.state, u.provider;
$$;
revoke all on function public.assistant_usage_summary() from public, anon, authenticated;
grant execute on function public.assistant_usage_summary() to authenticated;
