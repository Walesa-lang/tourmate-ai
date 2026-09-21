-- Additive extension of the existing profile. No new profile source of truth.
alter table public.profiles add column travel_profile jsonb not null default '{}'::jsonb;

-- Only the narrow transactional RPC may mutate the extension. It derives the
-- owner from auth.uid(), locks that owner's row, and never accepts an owner ID.
create or replace function public.update_travel_profile(p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner uuid := (select auth.uid());
  profile jsonb;
  stage text := p_payload->>'stage';
  purpose text := p_payload->>'purpose';
  value jsonb := p_payload->'data';
  entry record;
  allowed text[];
  completed jsonb;
  stamp text := to_jsonb(now()) #>> '{}';
  previous jsonb;
begin
  if owner is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text) > 16384 then raise exception 'Invalid payload'; end if;
  select travel_profile into profile from public.profiles where id = owner for update;
  if not found then raise exception 'Profile unavailable'; end if;
  if p_action in ('step', 'skip', 'delete') then
    if stage is null or stage not in ('account','trip','interests','preferences','food') then raise exception 'Invalid stage'; end if;
    if p_action in ('skip','delete') and stage = 'account' then raise exception 'Essential account cannot be removed'; end if;
    if p_action = 'step' then
      if jsonb_typeof(value) is distinct from 'object' then raise exception 'Invalid step'; end if;
      allowed := case stage
        when 'account' then array['language']
        when 'trip' then array['arrival','departure','dates','area','origin','travellers','party']
        when 'interests' then array['selected','custom']
        when 'preferences' then array['budget','pace','accommodation','transport','accessibility']
        else array['allergies','diet','religiousFood'] end;
      for entry in select * from jsonb_each(value) loop
        if not (entry.key = any(allowed)) then raise exception 'Unexpected field'; end if;
        if entry.key = 'selected' then
          if jsonb_typeof(entry.value) <> 'array' or jsonb_array_length(entry.value) > 13 then raise exception 'Invalid interests'; end if;
          if exists (select 1 from jsonb_array_elements(entry.value) as i(v) where jsonb_typeof(v) <> 'string' or (v #>> '{}') not in ('Nature','Wildlife','Culture','Museums','Food','Nightlife','Music','Sport','Hiking','Skydiving','Adventure','Relaxation','Business')) then raise exception 'Invalid interest'; end if;
        elsif jsonb_typeof(entry.value) <> 'string' or char_length(entry.value #>> '{}') > (case when entry.key in ('custom','accessibility','allergies','diet','religiousFood') then 300 else 120 end) then
          raise exception 'Invalid answer';
        end if;
      end loop;
      if value ? 'language' and value->>'language' not in ('en','fr','es','pt','zh') then raise exception 'Invalid language'; end if;
      if value ? 'dates' and value->>'dates' not in ('unknown','flexible','fixed') then raise exception 'Invalid dates'; end if;
      if value ? 'party' and value->>'party' not in ('solo','couple','family','friends','business','group') then raise exception 'Invalid party'; end if;
      if value ? 'budget' and value->>'budget' not in ('budget','comfort','luxury') then raise exception 'Invalid budget'; end if;
      if value ? 'pace' and value->>'pace' not in ('relaxed','balanced','packed') then raise exception 'Invalid pace'; end if;
      if value ? 'accommodation' and value->>'accommodation' not in ('hotel','guesthouse','lodge','camping','apartment') then raise exception 'Invalid accommodation'; end if;
      if value ? 'transport' and value->>'transport' not in ('rental car','guided tour','transfer','public transport') then raise exception 'Invalid transport'; end if;
      if value ? 'travellers' and ((value->>'travellers') !~ '^[0-9]{1,3}$' or (value->>'travellers')::int not between 1 and 100) then raise exception 'Invalid travellers'; end if;
      if value ? 'arrival' and ((value->>'arrival') !~ '^\d{4}-\d{2}-\d{2}$' or (value->>'arrival')::date not between date '2000-01-01' and date '2100-12-31') then raise exception 'Invalid arrival'; end if;
      if value ? 'departure' and ((value->>'departure') !~ '^\d{4}-\d{2}-\d{2}$' or (value->>'departure')::date not between date '2000-01-01' and date '2100-12-31') then raise exception 'Invalid departure'; end if;
      if value ? 'arrival' and value ? 'departure' and (value->>'departure')::date < (value->>'arrival')::date then raise exception 'Invalid date order'; end if;
      if stage = 'food' and profile #>> '{consents,food,status}' is distinct from 'granted' then raise exception 'Food consent required' using errcode = '42501'; end if;
      if stage = 'account' then
        if jsonb_typeof(p_payload->'full_name') is distinct from 'string' or char_length(p_payload->>'full_name') > 200 then raise exception 'Invalid name'; end if;
        update public.profiles set full_name = nullif(btrim(p_payload->>'full_name'), '') where id = owner;
      end if;
      profile := jsonb_set(profile, array[stage], value);
    elsif p_action = 'delete' then profile := profile - stage;
    end if;
    select coalesce(jsonb_agg(s), '[]'::jsonb) into completed from (select distinct s from jsonb_array_elements_text(coalesce(profile->'completed','[]'::jsonb)) as t(s) where s <> stage) q;
    if p_action <> 'delete' then completed := completed || jsonb_build_array(stage); end if;
    profile := jsonb_set(profile, '{completed}', completed);
  elsif p_action = 'consent' then
    if purpose is null or purpose not in ('personalisation','food','location','safety') or jsonb_typeof(p_payload->'granted') is distinct from 'boolean' then raise exception 'Invalid consent'; end if;
    if (p_payload->>'granted')::boolean and purpose in ('location','safety') then raise exception 'Purpose not active'; end if;
    previous := profile #> array['consents',purpose];
    profile := jsonb_set(profile, '{consents}', coalesce(profile->'consents','{}'::jsonb) || jsonb_build_object(purpose, jsonb_build_object(
      'status', case when (p_payload->>'granted')::boolean then 'granted' else 'withdrawn' end,
      'version','2026-09-v1','source','profile-builder','updated_at',stamp,
      'granted_at',case when (p_payload->>'granted')::boolean then to_jsonb(stamp) else previous->'granted_at' end,
      'withdrawn_at',case when not (p_payload->>'granted')::boolean then to_jsonb(stamp) else null end)));
    if purpose = 'food' and not (p_payload->>'granted')::boolean then profile := profile - 'food'; end if;
  else raise exception 'Invalid action';
  end if;
  update public.profiles set travel_profile = profile where id = owner;
  return profile;
end;
$$;
revoke all on function public.update_travel_profile(text,jsonb) from public, anon, authenticated;
grant execute on function public.update_travel_profile(text,jsonb) to authenticated;
-- Existing profile SELECT/UPDATE RLS remains in force. No browser grant to
-- update travel_profile: the RPC is the sole writer and checks ownership above.
comment on column public.profiles.travel_profile is 'Optional traveller stages and purpose-specific consent. Food withdrawal clears food data. Account deletion cascades; backups expire under operator retention policy.';
