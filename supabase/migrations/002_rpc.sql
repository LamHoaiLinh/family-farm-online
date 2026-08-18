-- Server-authoritative game transactions. Implementation functions live in private.

create or replace function private.inventory_used(p_owner uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(i.quantity),0)::int from public.inventory i where i.owner_id = p_owner
$$;

create or replace function private.plant_crop_impl(p_plot_id uuid, p_crop_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_plot public.farm_plots; v_crop public.crop_catalog; v_player public.profiles; v_speed numeric;
begin
  if v_uid is null then raise exception 'Bạn chưa đăng nhập'; end if;
  select * into v_plot from public.farm_plots where id=p_plot_id and owner_id=v_uid for update;
  if not found then raise exception 'Ô đất không hợp lệ'; end if;
  if v_plot.crop_id is not null then raise exception 'Ô đất đang được sử dụng'; end if;
  select * into v_crop from public.crop_catalog where id=p_crop_id; if not found then raise exception 'Cây không tồn tại'; end if;
  select * into v_player from public.profiles where id=v_uid for update; if not found then raise exception 'Không tìm thấy hồ sơ người chơi'; end if;
  if v_player.level < v_crop.level_required then raise exception 'Chưa đủ cấp để mở cây'; end if;
  if v_player.gold < v_crop.seed_cost then raise exception 'Bạn chưa đủ Vàng để mua hạt giống'; end if;
  v_speed := 1 + least(v_player.growth_speed_level,10) * 0.06;
  update public.profiles set gold=gold-v_crop.seed_cost where id=v_uid;
  update public.farm_plots set crop_id=p_crop_id, planted_at=now(), watered_at=now(), harvest_at=now()+make_interval(mins=>ceil(v_crop.grow_minutes/v_speed)::int), dead_at=null, death_reason=null, stolen_total=0, crop_cycle=gen_random_uuid() where id=p_plot_id;
end$$;

create or replace function private.water_crop_impl(p_plot_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Bạn chưa đăng nhập'; end if;
  update public.farm_plots set watered_at=now() where id=p_plot_id and owner_id=v_uid and crop_id is not null and dead_at is null;
  if not found then raise exception 'Không thể tưới ô này'; end if;
end$$;

create or replace function private.harvest_crop_impl(p_plot_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_plot public.farm_plots; v_crop public.crop_catalog; v_used int; v_qty int;
begin
  if v_uid is null then raise exception 'Bạn chưa đăng nhập'; end if;
  select * into v_plot from public.farm_plots where id=p_plot_id and owner_id=v_uid for update;
  if not found or v_plot.crop_id is null then raise exception 'Không có cây để thu hoạch'; end if;
  if v_plot.dead_at is not null then raise exception 'Cây đã chết: %',coalesce(v_plot.death_reason,'không rõ nguyên nhân'); end if;
  if now() < v_plot.harvest_at then raise exception 'Cây chưa chín'; end if;
  select * into v_crop from public.crop_catalog where id=v_plot.crop_id;
  v_qty := greatest(1,v_crop.base_yield-v_plot.stolen_total); v_used := private.inventory_used(v_uid);
  if v_used+v_qty > (select warehouse_capacity from public.profiles where id=v_uid) then raise exception 'Kho đã đầy. Hãy bán, giao đơn hoặc mở rộng Kho'; end if;
  insert into public.inventory(owner_id,item_id,quantity) values(v_uid,v_plot.crop_id,v_qty)
  on conflict(owner_id,item_id,quality) do update set quantity=public.inventory.quantity+excluded.quantity;
  update public.profiles set exp=exp+v_crop.exp_reward where id=v_uid;
  update public.farm_plots set crop_id=null,planted_at=null,watered_at=null,harvest_at=null,dead_at=null,death_reason=null,stolen_total=0,crop_cycle=null where id=p_plot_id;
  return jsonb_build_object('item_id',v_crop.id,'quantity',v_qty);
end$$;

create or replace function private.expand_warehouse_impl() returns int
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_cap int;
begin
  if v_uid is null then raise exception 'Bạn chưa đăng nhập'; end if;
  update public.profiles set diamonds=diamonds-1,warehouse_capacity=warehouse_capacity+5 where id=v_uid and diamonds>=1 returning warehouse_capacity into v_cap;
  if not found then raise exception 'Bạn chưa đủ Kim Cương'; end if; return v_cap;
end$$;

create or replace function private.sell_item_impl(p_item_id text,p_qty int) returns int
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_price int; v_gold bigint;
begin
  if v_uid is null then raise exception 'Bạn chưa đăng nhập'; end if;
  if p_qty<=0 then raise exception 'Số lượng không hợp lệ'; end if;
  select sell_price into v_price from public.crop_catalog where id=p_item_id; if v_price is null then raise exception 'Nông sản không hợp lệ'; end if;
  update public.inventory set quantity=quantity-p_qty where owner_id=v_uid and item_id=p_item_id and quality='thuong' and quantity>=p_qty;
  if not found then raise exception 'Không đủ nông sản'; end if;
  delete from public.inventory where owner_id=v_uid and item_id=p_item_id and quality='thuong' and quantity=0;
  update public.profiles set gold=gold+(v_price::bigint*p_qty) where id=v_uid returning gold into v_gold; return v_gold::int;
end$$;

create or replace function private.list_family_neighbors_impl() returns table(id uuid,name text,level int,online boolean)
language sql stable security definer set search_path = '' as $$
  select p.id,p.display_name,p.level,(p.last_seen_at>now()-interval '2 minutes') from public.profiles p
  where p.family_id=private.my_family_id() and p.id<>(select auth.uid()) order by p.display_name
$$;

create or replace function private.get_neighbor_farm_impl(p_neighbor_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Bạn chưa đăng nhập'; end if;
  if not private.same_family_user(p_neighbor_id) or p_neighbor_id=(select auth.uid()) then raise exception 'Không phải hàng xóm trong gia đình'; end if;
  select jsonb_build_object('player',jsonb_build_object('id',p.id,'name',p.display_name,'level',p.level),'plots',coalesce((select jsonb_agg(fp order by fp.row,fp.col) from public.farm_plots fp where fp.owner_id=p.id),'[]'::jsonb)) into v_result from public.profiles p where p.id=p_neighbor_id;
  return v_result;
end$$;

create or replace function private.steal_crop_impl(p_target_owner uuid,p_plot_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_plot public.farm_plots; v_crop public.crop_catalog; v_actor public.profiles; v_target public.profiles; v_used int; v_max_stolen int;
begin
  if v_uid is null then raise exception 'Bạn chưa đăng nhập'; end if;
  if p_target_owner=v_uid then raise exception 'Không thể hái trộm vườn của chính mình'; end if;
  select * into v_actor from public.profiles where id=v_uid; select * into v_target from public.profiles where id=p_target_owner;
  if not found or v_actor.family_id is distinct from v_target.family_id then raise exception 'Không phải hàng xóm trong gia đình'; end if;
  select * into v_plot from public.farm_plots where id=p_plot_id and owner_id=p_target_owner for update;
  if not found or v_plot.crop_id is null then raise exception 'Không có cây để lấy'; end if;
  if v_plot.dead_at is not null or now()<v_plot.harvest_at then raise exception 'Cây này chưa thể hái'; end if;
  if exists(select 1 from public.neighbor_actions where actor_id=v_uid and plot_id=p_plot_id and crop_cycle=v_plot.crop_cycle and action_type='steal') then raise exception 'Bạn đã lấy từ cây này rồi'; end if;
  select * into v_crop from public.crop_catalog where id=v_plot.crop_id; v_max_stolen:=greatest(1,floor(v_crop.base_yield*.2));
  if v_plot.stolen_total>=v_max_stolen then raise exception 'Cây này đã bị lấy đủ giới hạn'; end if;
  v_used:=private.inventory_used(v_uid); if v_used+1>v_actor.warehouse_capacity then raise exception 'Kho của bạn đã đầy nên không thể lấy thêm'; end if;
  insert into public.inventory(owner_id,item_id,quantity) values(v_uid,v_plot.crop_id,1)
  on conflict(owner_id,item_id,quality) do update set quantity=public.inventory.quantity+1;
  update public.farm_plots set stolen_total=stolen_total+1 where id=p_plot_id;
  insert into public.neighbor_actions(family_id,actor_id,target_id,plot_id,crop_cycle,action_type,quantity,item_id) values(v_actor.family_id,v_uid,p_target_owner,p_plot_id,v_plot.crop_cycle,'steal',1,v_plot.crop_id);
  insert into public.activity_logs(family_id,actor_id,target_id,event_type,message) values(v_actor.family_id,v_uid,p_target_owner,'crop_stolen',v_actor.display_name||' đã hái trộm 1 '||v_crop.name_vi||' từ vườn của '||v_target.display_name||'.');
  return jsonb_build_object('item_id',v_plot.crop_id,'quantity',1,'message','Hái trộm thành công 1 '||v_crop.name_vi||'.');
end$$;

create or replace function private.touch_presence_impl() returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); begin
  if v_uid is null then raise exception 'Bạn chưa đăng nhập'; end if; update public.profiles set last_seen_at=now() where id=v_uid;
end$$;

revoke all on function private.inventory_used(uuid) from public, anon, authenticated;
revoke all on function private.plant_crop_impl(uuid,text), private.water_crop_impl(uuid), private.harvest_crop_impl(uuid), private.expand_warehouse_impl(), private.sell_item_impl(text,int), private.list_family_neighbors_impl(), private.get_neighbor_farm_impl(uuid), private.steal_crop_impl(uuid,uuid), private.touch_presence_impl() from public, anon;
grant execute on function private.plant_crop_impl(uuid,text), private.water_crop_impl(uuid), private.harvest_crop_impl(uuid), private.expand_warehouse_impl(), private.sell_item_impl(text,int), private.list_family_neighbors_impl(), private.get_neighbor_farm_impl(uuid), private.steal_crop_impl(uuid,uuid), private.touch_presence_impl() to authenticated;

create or replace function public.plant_crop(p_plot_id uuid,p_crop_id text) returns void language sql security invoker set search_path='' as $$select private.plant_crop_impl(p_plot_id,p_crop_id)$$;
create or replace function public.water_crop(p_plot_id uuid) returns void language sql security invoker set search_path='' as $$select private.water_crop_impl(p_plot_id)$$;
create or replace function public.harvest_crop(p_plot_id uuid) returns jsonb language sql security invoker set search_path='' as $$select private.harvest_crop_impl(p_plot_id)$$;
create or replace function public.expand_warehouse() returns int language sql security invoker set search_path='' as $$select private.expand_warehouse_impl()$$;
create or replace function public.sell_item(p_item_id text,p_qty int) returns int language sql security invoker set search_path='' as $$select private.sell_item_impl(p_item_id,p_qty)$$;
create or replace function public.list_family_neighbors() returns table(id uuid,name text,level int,online boolean) language sql stable security invoker set search_path='' as $$select * from private.list_family_neighbors_impl()$$;
create or replace function public.get_neighbor_farm(p_neighbor_id uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.get_neighbor_farm_impl(p_neighbor_id)$$;
create or replace function public.steal_crop(p_target_owner uuid,p_plot_id uuid) returns jsonb language sql security invoker set search_path='' as $$select private.steal_crop_impl(p_target_owner,p_plot_id)$$;
create or replace function public.touch_presence() returns void language sql security invoker set search_path='' as $$select private.touch_presence_impl()$$;

revoke execute on function public.plant_crop(uuid,text), public.water_crop(uuid), public.harvest_crop(uuid), public.expand_warehouse(), public.sell_item(text,int), public.list_family_neighbors(), public.get_neighbor_farm(uuid), public.steal_crop(uuid,uuid), public.touch_presence() from public, anon;
grant execute on function public.plant_crop(uuid,text), public.water_crop(uuid), public.harvest_crop(uuid), public.expand_warehouse(), public.sell_item(text,int), public.list_family_neighbors(), public.get_neighbor_farm(uuid), public.steal_crop(uuid,uuid), public.touch_presence() to authenticated;
