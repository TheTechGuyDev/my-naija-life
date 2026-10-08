-- =========================================================
-- My Naija Life V6: social layer (players you can see, NaijaGram, follows, leaderboards)
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to run again.
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
