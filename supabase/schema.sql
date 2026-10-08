-- =========================================================
-- My Naija Life: Supabase schema
-- Run this whole file once in Supabase: SQL Editor → New query → paste → Run.
-- It is safe to run again (it drops and recreates policies and triggers).
-- =========================================================

-- ---------- tables ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  email         text,
  username      text unique,
  created_at    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  sessions      integer not null default 0,
  play_minutes  integer not null default 0,
  device        text,
  is_admin      boolean not null default false,
  banned        boolean not null default false,
  ban_reason    text
);

create table if not exists public.saves (
  user_id     uuid primary key references auth.users on delete cascade,
  data        jsonb not null,
  version     text,
  char_name   text,
  gender      text,
  area        text,
  game_day    integer,
  age         integer,
  money       bigint,
  job         text,
  education   text,
  relationship text,
  children    integer default 0,
  housing     text,
  updated_at  timestamptz not null default now()
);

create table if not exists public.events (
  id          bigserial primary key,
  user_id     uuid references auth.users on delete cascade,
  type        text not null,
  detail      text,
  game_day    integer,
  created_at  timestamptz not null default now()
);
create index if not exists events_user_idx on public.events (user_id, created_at desc);
create index if not exists events_time_idx on public.events (created_at desc);

create table if not exists public.announcements (
  id          bigserial primary key,
  title       text not null,
  body        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.admin_actions (
  id          bigserial primary key,
  user_id     uuid not null references auth.users on delete cascade,
  kind        text not null,          -- money | heal | message | reset
  payload     jsonb not null default '{}'::jsonb,
  applied     boolean not null default false,
  created_by  uuid references auth.users,
  created_at  timestamptz not null default now(),
  applied_at  timestamptz
);
create index if not exists admin_actions_user_idx on public.admin_actions (user_id, applied);

-- ---------- helper: is the current user an admin? ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------- new sign-ups get a profile row ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.profiles (id, email, username)
    values (new.id, new.email, nullif(new.raw_user_meta_data->>'username', ''))
    on conflict (id) do nothing;
  exception when unique_violation then
    -- username already taken: keep it unique by adding part of the user id
    insert into public.profiles (id, email, username)
    values (new.id, new.email, (new.raw_user_meta_data->>'username') || '_' || substr(new.id::text, 1, 4))
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- players cannot make themselves admin or unban themselves ----------
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.is_admin   := old.is_admin;
    new.banned     := old.banned;
    new.ban_reason := old.ban_reason;
    new.email      := old.email;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------- row level security ----------
alter table public.profiles      enable row level security;
alter table public.saves         enable row level security;
alter table public.events        enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_actions enable row level security;

drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles update" on public.profiles;
drop policy if exists "profiles delete" on public.profiles;
create policy "profiles read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "profiles delete" on public.profiles for delete using (public.is_admin());

drop policy if exists "saves read"   on public.saves;
drop policy if exists "saves insert" on public.saves;
drop policy if exists "saves update" on public.saves;
drop policy if exists "saves delete" on public.saves;
create policy "saves read"   on public.saves for select using (user_id = auth.uid() or public.is_admin());
create policy "saves insert" on public.saves for insert with check (user_id = auth.uid());
create policy "saves update" on public.saves for update using (user_id = auth.uid() or public.is_admin());
create policy "saves delete" on public.saves for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "events read"   on public.events;
drop policy if exists "events insert" on public.events;
create policy "events read"   on public.events for select using (user_id = auth.uid() or public.is_admin());
create policy "events insert" on public.events for insert with check (user_id = auth.uid());

drop policy if exists "ann read"  on public.announcements;
drop policy if exists "ann admin" on public.announcements;
create policy "ann read"  on public.announcements for select using (auth.role() = 'authenticated');
create policy "ann admin" on public.announcements for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "actions read"   on public.admin_actions;
drop policy if exists "actions apply"  on public.admin_actions;
drop policy if exists "actions insert" on public.admin_actions;
drop policy if exists "actions delete" on public.admin_actions;
create policy "actions read"   on public.admin_actions for select using (user_id = auth.uid() or public.is_admin());
create policy "actions apply"  on public.admin_actions for update using (user_id = auth.uid() or public.is_admin());
create policy "actions insert" on public.admin_actions for insert with check (public.is_admin());
create policy "actions delete" on public.admin_actions for delete using (public.is_admin());

-- ---------- make yourself admin ----------
-- After you sign up in the game with your own email, run this one line (with your email):
--   update public.profiles set is_admin = true where email = 'YOUR_EMAIL_HERE';
