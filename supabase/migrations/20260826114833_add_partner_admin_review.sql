-- Secure administration and review workflow for business partner applications.

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint admin_users_role_check check (role = 'admin')
);

alter table public.admin_users enable row level security;

create policy "Admins can verify their own membership"
on public.admin_users for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.admin_users from public, anon, authenticated;
grant select on table public.admin_users to authenticated;
grant select, insert, update, delete on table public.admin_users to service_role;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

alter table public.businesses
  add column rejection_reason text,
  add column reviewed_by uuid references auth.users (id) on delete set null,
  add column reviewed_at timestamptz,
  add constraint businesses_rejection_reason_check check (
    rejection_reason is null
    or char_length(btrim(rejection_reason)) between 1 and 2000
  ),
  add constraint businesses_review_state_check check (
    (status = 'pending' and rejection_reason is null and reviewed_by is null and reviewed_at is null)
    or (status = 'approved' and rejection_reason is null and reviewed_by is not null and reviewed_at is not null)
    or (status = 'rejected' and rejection_reason is not null and reviewed_by is not null and reviewed_at is not null)
  );

create index businesses_status_created_at_idx
  on public.businesses (status, created_at desc);

create index businesses_reviewed_by_idx
  on public.businesses (reviewed_by)
  where reviewed_by is not null;

create table public.business_application_reviews (
  application_id uuid primary key references public.businesses (id) on delete cascade,
  decision text not null,
  internal_admin_note text,
  reviewed_by uuid not null references auth.users (id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  constraint business_application_reviews_decision_check check (decision in ('approved', 'rejected')),
  constraint business_application_reviews_note_check check (
    internal_admin_note is null
    or char_length(btrim(internal_admin_note)) between 1 and 4000
  )
);

create index business_application_reviews_reviewer_idx
  on public.business_application_reviews (reviewed_by, reviewed_at desc);

alter table public.business_application_reviews enable row level security;

create policy "Admins can read application reviews"
on public.business_application_reviews for select to authenticated
using ((select private.is_admin()));

revoke all on table public.business_application_reviews from public, anon, authenticated;
grant select on table public.business_application_reviews to authenticated;
grant select, insert, update, delete on table public.business_application_reviews to service_role;

create or replace function private.protect_business_review()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  review_changed boolean;
  application_changed boolean;
  caller_is_admin boolean := (select private.is_admin());
begin
  review_changed :=
    new.status is distinct from old.status
    or new.rejection_reason is distinct from old.rejection_reason
    or new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at;

  application_changed :=
    new.owner_id is distinct from old.owner_id
    or new.business_name is distinct from old.business_name
    or new.business_type is distinct from old.business_type
    or new.description is distinct from old.description
    or new.country is distinct from old.country
    or new.city is distinct from old.city
    or new.contact_name is distinct from old.contact_name
    or new.contact_email is distinct from old.contact_email
    or new.phone is distinct from old.phone
    or new.website_url is distinct from old.website_url;

  if review_changed then
    if current_user <> 'service_role' and not caller_is_admin then
      raise exception 'Only administrators can review partner applications.' using errcode = '42501';
    end if;
    if old.status <> 'pending' or new.status not in ('approved', 'rejected') then
      raise exception 'Partner applications can only transition once from pending.' using errcode = '23514';
    end if;
    if new.status = 'rejected' and nullif(btrim(new.rejection_reason), '') is null then
      raise exception 'A rejection reason is required.' using errcode = '23514';
    end if;
    new.rejection_reason := case when new.status = 'rejected' then btrim(new.rejection_reason) else null end;
    new.reviewed_by := (select auth.uid());
    new.reviewed_at := now();
  elsif caller_is_admin and application_changed then
    raise exception 'Administrators cannot alter submitted application details.' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_business_review() from public, anon, authenticated;

create trigger businesses_protect_review
before update on public.businesses
for each row execute function private.protect_business_review();

create policy "Admins can read all business applications"
on public.businesses for select to authenticated
using ((select private.is_admin()));

create or replace function public.review_business_application(
  p_application_id uuid,
  p_decision text,
  p_rejection_reason text default null,
  p_internal_admin_note text default null
)
returns table (application_id uuid, application_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewer_id uuid := (select auth.uid());
  decided_id uuid;
  decided_status text;
  clean_reason text := nullif(btrim(p_rejection_reason), '');
  clean_note text := nullif(btrim(p_internal_admin_note), '');
begin
  if reviewer_id is null or not (select private.is_admin()) then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review decision.' using errcode = '23514';
  end if;
  if p_decision = 'rejected' and clean_reason is null then
    raise exception 'A rejection reason is required.' using errcode = '23514';
  end if;
  if clean_reason is not null and char_length(clean_reason) > 2000 then
    raise exception 'The rejection reason is too long.' using errcode = '22001';
  end if;
  if clean_note is not null and char_length(clean_note) > 4000 then
    raise exception 'The internal note is too long.' using errcode = '22001';
  end if;

  update public.businesses
  set status = p_decision,
      rejection_reason = case when p_decision = 'rejected' then clean_reason else null end,
      reviewed_by = reviewer_id,
      reviewed_at = now()
  where id = p_application_id and status = 'pending'
  returning id, status into decided_id, decided_status;

  if decided_id is null then
    raise exception 'Application is missing or is no longer pending.' using errcode = '23514';
  end if;

  insert into public.business_application_reviews (application_id, decision, internal_admin_note, reviewed_by, reviewed_at)
  select decided_id, decided_status, clean_note, reviewer_id, businesses.reviewed_at
  from public.businesses
  where businesses.id = decided_id;

  return query select decided_id, decided_status;
end;
$$;

revoke all on function public.review_business_application(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.review_business_application(uuid, text, text, text) to authenticated;
