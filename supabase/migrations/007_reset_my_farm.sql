create or replace function private.reset_my_farm_impl()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_family uuid;
begin
  if v_uid is null then
    raise exception 'Bạn chưa đăng nhập';
  end if;

  select family_id into v_family from public.profiles where id = v_uid for update;
  if v_family is null then
    raise exception 'Không tìm thấy hồ sơ người chơi';
  end if;

  update public.profiles
  set level = 1,
      exp = 0,
      gold = 50,
      diamonds = 0,
      warehouse_capacity = 50,
      growth_speed_level = 0,
      last_seen_at = now()
  where id = v_uid;

  update public.farm_plots
  set crop_id = null,
      planted_at = null,
      watered_at = null,
      harvest_at = null,
      dead_at = null,
      death_reason = null,
      stolen_total = 0,
      crop_cycle = null
  where owner_id = v_uid;

  insert into public.farm_plots(owner_id,row,col)
  select v_uid, r, c
  from generate_series(0,3) r
  cross join generate_series(0,5) c
  on conflict(owner_id,row,col) do nothing;

  delete from public.inventory where owner_id = v_uid;
  delete from public.orders where owner_id = v_uid;
  delete from public.player_materials where owner_id = v_uid;
  delete from public.player_villa_parts where owner_id = v_uid;
  delete from public.neighbor_actions where actor_id = v_uid or target_id = v_uid;
  delete from public.activity_logs where actor_id = v_uid or target_id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'gold', 50,
    'diamonds', 0,
    'level', 1,
    'warehouse_capacity', 50,
    'plot_count', 24
  );
end$$;

revoke all on function private.reset_my_farm_impl() from public, anon;
grant execute on function private.reset_my_farm_impl() to authenticated;

create or replace function public.reset_my_farm()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.reset_my_farm_impl()
$$;

revoke execute on function public.reset_my_farm() from public, anon;
grant execute on function public.reset_my_farm() to authenticated;
