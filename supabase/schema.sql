-- StayMpumalanga V1 schema. Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 role text not null default 'student' check (role in ('student','provider','admin')),
 phone text,
 created_at timestamptz not null default now()
);

create table if not exists public.accommodations (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.profiles(id) on delete cascade,
 name text not null,
 description text,
 location text not null,
 institution text,
 address text,
 price numeric(10,2) not null,
 nsfas boolean not null default false,
 room_type text,
 available_rooms integer not null default 0,
 amenities text[] not null default '{}',
 image_url text,
 latitude double precision,
 longitude double precision,
 status text not null default 'pending' check (status in ('draft','pending','approved','rejected','archived')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.applications (
 id uuid primary key default gen_random_uuid(),
 accommodation_id uuid not null references public.accommodations(id) on delete cascade,
 student_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'submitted' check (status in ('submitted','reviewing','approved','declined','withdrawn')),
 message text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(accommodation_id, student_id)
);

create table if not exists public.favorites (
 student_id uuid not null references public.profiles(id) on delete cascade,
 accommodation_id uuid not null references public.accommodations(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(student_id, accommodation_id)
);

create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(),
 accommodation_id uuid not null references public.accommodations(id) on delete cascade,
 student_id uuid not null references public.profiles(id) on delete cascade,
 rating integer not null check (rating between 1 and 5),
 body text,
 created_at timestamptz not null default now(),
 unique(accommodation_id, student_id)
);

alter table public.profiles enable row level security;
alter table public.accommodations enable row level security;
alter table public.applications enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

create policy "profiles own row" on public.profiles for select using (auth.uid()=id);
create policy "profiles insert own row" on public.profiles for insert with check (auth.uid()=id);
create policy "profiles update own row" on public.profiles for update using (auth.uid()=id);
create policy "approved accommodations public read" on public.accommodations for select using (status='approved' or provider_id=auth.uid());
create policy "providers create own accommodations" on public.accommodations for insert with check (provider_id=auth.uid());
create policy "providers update own accommodations" on public.accommodations for update using (provider_id=auth.uid());
create policy "students read own applications" on public.applications for select using (student_id=auth.uid());
create policy "providers read applications to own listings" on public.applications for select using (exists(select 1 from public.accommodations a where a.id=accommodation_id and a.provider_id=auth.uid()));
create policy "students create applications" on public.applications for insert with check (student_id=auth.uid());
create policy "students update own applications" on public.applications for update using (student_id=auth.uid());
create policy "students own favorites" on public.favorites for all using (student_id=auth.uid()) with check (student_id=auth.uid());
create policy "public read reviews" on public.reviews for select using (true);
create policy "students create reviews" on public.reviews for insert with check (student_id=auth.uid());
create policy "students update own reviews" on public.reviews for update using (student_id=auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id) values(new.id) on conflict do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
