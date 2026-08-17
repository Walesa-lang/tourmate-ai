-- Phase 1: business partner applications.

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  business_name text not null,
  business_type text not null,
  description text not null,
  country text not null,
  city text not null,
  contact_name text not null,
  contact_email text not null,
  phone text not null,
  website_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_owner_unique unique (owner_id),
  constraint businesses_business_type_check check (business_type in ('accommodation', 'car_rental', 'tour_operator', 'restaurant', 'attraction', 'other')),
  constraint businesses_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint businesses_business_name_check check (char_length(btrim(business_name)) between 1 and 200),
  constraint businesses_description_check check (char_length(btrim(description)) between 1 and 2000),
  constraint businesses_country_check check (char_length(btrim(country)) between 1 and 120),
  constraint businesses_city_check check (char_length(btrim(city)) between 1 and 160),
  constraint businesses_contact_name_check check (char_length(btrim(contact_name)) between 1 and 200),
  constraint businesses_contact_email_check check (char_length(btrim(contact_email)) between 3 and 320),
  constraint businesses_phone_check check (char_length(btrim(phone)) between 1 and 50),
  constraint businesses_website_url_check check (website_url is null or (char_length(website_url) <= 2048 and website_url ~* '^https?://'))
);

create trigger businesses_set_updated_at before update on public.businesses
for each row execute function private.set_updated_at();

alter table public.businesses enable row level security;

create policy "Users can create their own business application" on public.businesses
for insert to authenticated with check ((select auth.uid()) = owner_id and status = 'pending');

create policy "Users can read their own business application" on public.businesses
for select to authenticated using ((select auth.uid()) = owner_id);

create policy "Users can update their own pending business application" on public.businesses
for update to authenticated
using ((select auth.uid()) = owner_id and status = 'pending')
with check ((select auth.uid()) = owner_id and status = 'pending');

revoke all on table public.businesses from public, anon, authenticated;
grant select, insert on table public.businesses to authenticated;
grant update (business_name, business_type, description, country, city, contact_name, contact_email, phone, website_url) on table public.businesses to authenticated;
grant select, insert, update, delete on table public.businesses to service_role;
