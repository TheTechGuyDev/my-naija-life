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
  -- auth.uid() is null in the SQL Editor / service role: those are trusted
  if auth.uid() is not null and not public.is_admin() then
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

-- a player creating their own missing profile row can never make it admin or banned
create or replace function public.protect_profile_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null in the SQL Editor / service role: those are trusted
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin := false;
    new.banned   := false;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_insert on public.profiles;
create trigger protect_profile_insert before insert on public.profiles
  for each row execute function public.protect_profile_insert();

-- ---------- row level security ----------
alter table public.profiles      enable row level security;
alter table public.saves         enable row level security;
alter table public.events        enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_actions enable row level security;

drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
drop policy if exists "profiles delete" on public.profiles;
create policy "profiles read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "profiles delete" on public.profiles for delete using (public.is_admin());
drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles for insert with check (id = auth.uid());

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

-- =========================================================
-- V6 SOCIAL (same as supabase/v6_social.sql)
-- =========================================================

-- Public player card: what other players (and the public share page) can see.
create table if not exists public.players_public (
  user_id      uuid primary key references auth.users on delete cascade,
  username     text,
  char_name    text,
  gender       text,
  area_id      text,
  area         text,
  game_day     integer,
  age          integer,
  net_worth    bigint default 0,
  rep          integer default 0,
  followers    integer default 0,
  children     integer default 0,
  job          text,
  education    text,
  relationship text,
  housing      text,
  story        jsonb default '[]'::jsonb,
  x            real,
  y            real,
  inside       text,
  online_at    timestamptz,
  updated_at   timestamptz not null default now()
);
create index if not exists players_public_area_idx on public.players_public (area_id, online_at desc);
create index if not exists players_public_username_idx on public.players_public (lower(username));

create table if not exists public.posts (
  id         bigserial primary key,
  user_id    uuid not null references auth.users on delete cascade,
  username   text,
  char_name  text,
  area       text,
  caption    text check (char_length(caption) <= 300),
  image      text check (char_length(image) <= 200000 and image like 'data:image/%'),
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_time_idx on public.posts (created_at desc);
create index if not exists posts_user_idx on public.posts (user_id, created_at desc);

create table if not exists public.post_likes (
  post_id    bigint not null references public.posts on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id         bigserial primary key,
  post_id    bigint not null references public.posts on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  username   text,
  body       text not null check (char_length(body) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

create table if not exists public.follows (
  follower   uuid not null references auth.users on delete cascade,
  followee   uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);
create index if not exists follows_followee_idx on public.follows (followee);

create table if not exists public.waves (
  id         bigserial primary key,
  from_user  uuid not null references auth.users on delete cascade,
  to_user    uuid not null references auth.users on delete cascade,
  from_name  text,
  seen       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists waves_to_idx on public.waves (to_user, seen);

alter table public.players_public enable row level security;
alter table public.posts          enable row level security;
alter table public.post_likes     enable row level security;
alter table public.post_comments  enable row level security;
alter table public.follows        enable row level security;
alter table public.waves          enable row level security;

-- players_public: anyone can read (share pages), you write only your own row
drop policy if exists "pp read"   on public.players_public;
drop policy if exists "pp insert" on public.players_public;
drop policy if exists "pp update" on public.players_public;
drop policy if exists "pp delete" on public.players_public;
create policy "pp read"   on public.players_public for select using (true);
create policy "pp insert" on public.players_public for insert with check (user_id = auth.uid());
create policy "pp update" on public.players_public for update using (user_id = auth.uid());
create policy "pp delete" on public.players_public for delete using (user_id = auth.uid() or public.is_admin());

-- posts
drop policy if exists "posts read"   on public.posts;
drop policy if exists "posts insert" on public.posts;
drop policy if exists "posts update" on public.posts;
drop policy if exists "posts delete" on public.posts;
create policy "posts read"   on public.posts for select using (not hidden or user_id = auth.uid() or public.is_admin());
create policy "posts insert" on public.posts for insert with check (user_id = auth.uid());
create policy "posts update" on public.posts for update using (user_id = auth.uid() or public.is_admin());
create policy "posts delete" on public.posts for delete using (user_id = auth.uid() or public.is_admin());

-- likes
drop policy if exists "likes read"   on public.post_likes;
drop policy if exists "likes insert" on public.post_likes;
drop policy if exists "likes delete" on public.post_likes;
create policy "likes read"   on public.post_likes for select using (true);
create policy "likes insert" on public.post_likes for insert with check (user_id = auth.uid());
create policy "likes delete" on public.post_likes for delete using (user_id = auth.uid());

-- comments
drop policy if exists "comments read"   on public.post_comments;
drop policy if exists "comments insert" on public.post_comments;
drop policy if exists "comments delete" on public.post_comments;
create policy "comments read"   on public.post_comments for select using (true);
create policy "comments insert" on public.post_comments for insert with check (user_id = auth.uid());
create policy "comments delete" on public.post_comments for delete using (user_id = auth.uid() or public.is_admin());

-- follows
drop policy if exists "follows read"   on public.follows;
drop policy if exists "follows insert" on public.follows;
drop policy if exists "follows delete" on public.follows;
create policy "follows read"   on public.follows for select using (true);
create policy "follows insert" on public.follows for insert with check (follower = auth.uid());
create policy "follows delete" on public.follows for delete using (follower = auth.uid());

-- waves
drop policy if exists "waves read"   on public.waves;
drop policy if exists "waves insert" on public.waves;
drop policy if exists "waves update" on public.waves;
create policy "waves read"   on public.waves for select using (to_user = auth.uid() or from_user = auth.uid());
create policy "waves insert" on public.waves for insert with check (from_user = auth.uid());
create policy "waves update" on public.waves for update using (to_user = auth.uid());

-- ---------- backfill: profiles for anyone who signed up before this file was run ----------
insert into public.profiles (id, email, username)
select u.id, u.email, nullif(u.raw_user_meta_data->>'username', '') from auth.users u
on conflict do nothing;

-- ---------- make yourself admin ----------
-- After you sign up in the game with your own email, run this one line (with your email):
--   update public.profiles set is_admin = true where email = 'YOUR_EMAIL_HERE';
