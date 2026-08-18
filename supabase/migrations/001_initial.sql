-- Family Farm Online - schema v1 (security hardened for Supabase)
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code_hash text not null unique,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  username text not null,
  display_name text not null,
  level int not null default 1 check(level >= 1),
  exp bigint not null default 0 check(exp >= 0),
  gold bigint not null default 50 check(gold >= 0),
  diamonds int not null default 0 check(diamonds >= 0),
  warehouse_capacity int not null default 50 check(warehouse_capacity >= 1),
  growth_speed_level int not null default 0 check(growth_speed_level between 0 and 10),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(family_id, username)
);
create unique index if not exists profiles_username_global_unique on public.profiles(lower(username));
create index if not exists profiles_family_id_idx on public.profiles(family_id);

create table if not exists public.crop_catalog (
  id text primary key,
  name_vi text not null,
  level_required int not null check(level_required >= 1),
  seed_cost int not null check(seed_cost >= 0),
  grow_minutes int not null check(grow_minutes > 0),
  base_yield int not null check(base_yield > 0),
  sell_price int not null check(sell_price >= 0),
  exp_reward int not null check(exp_reward >= 0),
  water_tolerance_hours numeric not null check(water_tolerance_hours > 0),
  disease_risk numeric not null default 0 check(disease_risk between 0 and 1)
);

create table if not exists public.farm_plots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  row int not null check(row >= 0),
  col int not null check(col >= 0),
  crop_id text references public.crop_catalog(id),
  planted_at timestamptz,
  watered_at timestamptz,
  harvest_at timestamptz,
  dead_at timestamptz,
  death_reason text,
  stolen_total int not null default 0 check(stolen_total >= 0),
  crop_cycle uuid,
  unique(owner_id,row,col)
);
create index if not exists farm_plots_owner_idx on public.farm_plots(owner_id);

create table if not exists public.inventory (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null,
  quantity int not null default 0 check(quantity >= 0),
  quality text not null default 'thuong' check(quality in ('thuong','tuoi','hao_hang')),
  primary key(owner_id,item_id,quality)
);

create table if not exists public.neighbor_actions (
  id bigserial primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  plot_id uuid references public.farm_plots(id) on delete set null,
  crop_cycle uuid,
  action_type text not null check(action_type in ('visit','water_help','steal','caught')),
  quantity int not null default 0 check(quantity >= 0),
  item_id text,
  created_at timestamptz not null default now()
);
create unique index if not exists one_steal_per_cycle on public.neighbor_actions(actor_id,plot_id,crop_cycle) where action_type='steal';
create index if not exists neighbor_actions_family_created_idx on public.neighbor_actions(family_id, created_at desc);

create table if not exists public.activity_logs (
  id bigserial primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_family_created_idx on public.activity_logs(family_id, created_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slot int not null check(slot between 1 and 3),
  status text not null default 'active' check(status in ('active','cooldown','completed')),
  requirements jsonb not null default '{}'::jsonb,
  reward_gold int not null default 0 check(reward_gold >= 0),
  reward_exp int not null default 0 check(reward_exp >= 0),
  reward_materials jsonb not null default '{}'::jsonb,
  available_after timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id,slot)
);
create index if not exists orders_owner_idx on public.orders(owner_id);

create table if not exists public.player_materials (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  material_id text not null,
  quantity int not null default 0 check(quantity >= 0),
  primary key(owner_id,material_id)
);

create table if not exists public.player_villa_parts (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  part_id text not null,
  state text not null default 'locked' check(state in ('locked','available','building','completed')),
  style_variant text,
  completed_at timestamptz,
  primary key(owner_id,part_id)
);

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.crop_catalog enable row level security;
alter table public.farm_plots enable row level security;
alter table public.inventory enable row level security;
alter table public.neighbor_actions enable row level security;
alter table public.activity_logs enable row level security;
alter table public.orders enable row level security;
alter table public.player_materials enable row level security;
alter table public.player_villa_parts enable row level security;

create or replace function private.my_family_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select p.family_id from public.profiles p where p.id = (select auth.uid())
$$;
create or replace function private.same_family_user(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles me
    join public.profiles other_user on other_user.family_id = me.family_id
    where me.id = (select auth.uid()) and other_user.id = p_user_id
  )
$$;
revoke all on function private.my_family_id() from public, anon;
revoke all on function private.same_family_user(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.my_family_id(), private.same_family_user(uuid) to authenticated;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.crop_catalog, public.profiles, public.farm_plots, public.inventory,
  public.neighbor_actions, public.activity_logs, public.orders, public.player_materials,
  public.player_villa_parts to authenticated;

create policy crop_catalog_read on public.crop_catalog for select to authenticated using (true);
create policy profile_same_family_read on public.profiles for select to authenticated using (family_id = (select private.my_family_id()));
create policy plot_same_family_read on public.farm_plots for select to authenticated using ((select private.same_family_user(owner_id)));
create policy inventory_self_read on public.inventory for select to authenticated using ((select auth.uid()) is not null and owner_id = (select auth.uid()));
create policy orders_self_read on public.orders for select to authenticated using ((select auth.uid()) is not null and owner_id = (select auth.uid()));
create policy mats_self_read on public.player_materials for select to authenticated using ((select auth.uid()) is not null and owner_id = (select auth.uid()));
create policy villa_family_read on public.player_villa_parts for select to authenticated using ((select private.same_family_user(owner_id)));
create policy actions_family_read on public.neighbor_actions for select to authenticated using (family_id = (select private.my_family_id()));
create policy logs_family_read on public.activity_logs for select to authenticated using (family_id = (select private.my_family_id()));

alter default privileges for role postgres in schema public revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public;
