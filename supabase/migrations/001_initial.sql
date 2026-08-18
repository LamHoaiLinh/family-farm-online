-- Family Farm Online - schema v1
create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code_hash text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  username text not null,
  display_name text not null,
  level int not null default 1 check(level>=1),
  exp bigint not null default 0 check(exp>=0),
  gold bigint not null default 50 check(gold>=0),
  diamonds int not null default 0 check(diamonds>=0),
  warehouse_capacity int not null default 50 check(warehouse_capacity>=1),
  growth_speed_level int not null default 0 check(growth_speed_level>=0),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(family_id, username)
);
create unique index if not exists profiles_username_global_unique on public.profiles(lower(username));

create table if not exists public.crop_catalog (
  id text primary key,
  name_vi text not null,
  level_required int not null,
  seed_cost int not null,
  grow_minutes int not null,
  base_yield int not null,
  sell_price int not null,
  exp_reward int not null,
  water_tolerance_hours numeric not null,
  disease_risk numeric not null default 0
);

create table if not exists public.farm_plots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  row int not null,
  col int not null,
  crop_id text references public.crop_catalog(id),
  planted_at timestamptz,
  watered_at timestamptz,
  harvest_at timestamptz,
  dead_at timestamptz,
  death_reason text,
  stolen_total int not null default 0,
  crop_cycle uuid,
  unique(owner_id,row,col)
);

create table if not exists public.inventory (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null,
  quantity int not null default 0 check(quantity>=0),
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
  quantity int not null default 0,
  item_id text,
  created_at timestamptz not null default now()
);
create unique index if not exists one_steal_per_cycle on public.neighbor_actions(actor_id,plot_id,crop_cycle) where action_type='steal';

create table if not exists public.activity_logs (
  id bigserial primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  target_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slot int not null check(slot between 1 and 3),
  status text not null default 'active' check(status in ('active','cooldown','completed')),
  requirements jsonb not null default '{}'::jsonb,
  reward_gold int not null default 0,
  reward_exp int not null default 0,
  reward_materials jsonb not null default '{}'::jsonb,
  available_after timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id,slot)
);

create table if not exists public.player_materials (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  material_id text not null,
  quantity int not null default 0 check(quantity>=0),
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

create or replace function public.my_family_id() returns uuid language sql stable security definer set search_path=public as $$select family_id from public.profiles where id=auth.uid()$$;

create policy crop_catalog_read on public.crop_catalog for select using (true);
create policy profile_same_family_read on public.profiles for select using (family_id=public.my_family_id());
create policy plot_same_family_read on public.farm_plots for select using (owner_id in (select id from public.profiles where family_id=public.my_family_id()));
create policy inventory_self_read on public.inventory for select using(owner_id=auth.uid());
create policy orders_self_read on public.orders for select using(owner_id=auth.uid());
create policy mats_self_read on public.player_materials for select using(owner_id=auth.uid());
create policy villa_family_read on public.player_villa_parts for select using(owner_id in(select id from public.profiles where family_id=public.my_family_id()));
create policy actions_family_read on public.neighbor_actions for select using(family_id=public.my_family_id());
create policy logs_family_read on public.activity_logs for select using(family_id=public.my_family_id());

-- Intentionally no direct INSERT/UPDATE policies for economy tables; sensitive mutations happen through SECURITY DEFINER RPC.
